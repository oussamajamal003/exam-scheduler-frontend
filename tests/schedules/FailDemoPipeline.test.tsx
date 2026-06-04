import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type Scenario = 'validation' | 'candidate';

let mockScenario: Scenario = 'validation';

const buildPrepareData = () => (
  mockScenario === 'validation'
    ? {
        activeCourseOfferingsCount: 80,
        roomsCount: 4,
        availableRoomsCount: 4,
        proctorsCount: 10,
        timeSlotsCount: 6,
      }
    : {
        activeCourseOfferingsCount: 30,
        roomsCount: 20,
        availableRoomsCount: 20,
        proctorsCount: 80,
        timeSlotsCount: 25,
      }
);

const buildValidationResult = () => (
  mockScenario === 'validation'
    ? {
        isValid: false,
        errors: { roomCapacity: ['No conflict-free schedule exists for current resources/data.'] },
        groups: {
          roomCapacity: {
            ok: false,
            issues: ['No conflict-free schedule exists for current resources/data.'],
          },
        },
      }
    : {
        isValid: true,
        errors: {},
        groups: {
          roomCapacity: { ok: true, issues: [] },
        },
      }
);

const buildGenerateError = () => ({
  response: {
    data: {
      data: {
        message: 'Exam cannot be assigned.\nNo valid candidate exists.\nGeneration stopped.',
        failedStepKey: 'filter',
      },
    },
  },
});

// Mock the scheduling hooks used inside the dialog so the pipeline can be driven
// deterministically in the test.
jest.mock('../../src/hooks/schedules/useSchedules', () => ({
  usePrepareScheduling: () => ({
    data: buildPrepareData(),
    mutate: (args: any, opts?: any) => opts?.onSuccess?.(buildPrepareData()),
    reset: () => {},
    error: null,
  }),
  useValidateSchedulingInput: () => ({
    data: buildValidationResult(),
    mutate: (args: any, opts?: any) => opts?.onSuccess?.(buildValidationResult()),
    reset: () => {},
    error: null,
  }),
  useGenerateSchedule: () => ({
    data: null,
    mutate: (args: any, opts?: any) => {
      if (mockScenario === 'candidate') {
        opts?.onError?.(buildGenerateError());
      }
    },
    reset: () => {},
    error: null,
  }),
}));

// Some of the internal imports expect a React Query client; provide a minimal
// mock of useQueryClient so the component can mount without the full app.
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ setQueryData: () => {} }),
  useQuery: (opts: any) => ({ data: undefined }),
}));

// Import the dialog component from the page after we've exported it.
import { GenerateScheduleDialog } from '../../src/pages/admin/SchedulesPage';

describe('Fail demo dataset pipeline UX', () => {
  beforeEach(() => {
    mockScenario = 'validation';
    jest.useRealTimers();
  });

  it('shows the room-capacity validation failure during Automatic Generation Check (step 2)', async () => {
    mockScenario = 'validation';
    const semesters = [{ id: 'sem1', name: 'Test Sem', startDate: '2026-01-01', endDate: '2026-01-10' }];
    const handleGenerated = jest.fn();

    render(
      <GenerateScheduleDialog
        open={true}
        onOpenChange={() => {}}
        semesters={semesters}
        semestersLoading={false}
        onGenerated={handleGenerated}
        existingNames={[]}
        // Force the validation failure UI for the test
        forceValidationFailure={true}
      />
    );

    const failureBanner = await screen.findByText(/No conflict-free schedule exists for current resources\/data\./i, {}, { timeout: 5000 });
    expect(failureBanner).toBeInTheDocument();
    expect(screen.getByText(/Primary Bottleneck/i)).toBeInTheDocument();
    expect(screen.getByText(/Room Capacity Shortage/i)).toBeInTheDocument();
    expect(screen.getByText(/Add more room or timeslots/i)).toBeInTheDocument();
  });

  it('stops during candidate filtering when Operating Systems has no valid candidate', async () => {
    mockScenario = 'candidate';
    jest.useFakeTimers();

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const semesters = [{ id: 'sem1', name: 'Test Sem', startDate: '2026-01-01', endDate: '2026-01-10' }];
    const handleGenerated = jest.fn();

    render(
      <GenerateScheduleDialog
        open={true}
        onOpenChange={() => {}}
        semesters={semesters}
        semestersLoading={false}
        onGenerated={handleGenerated}
        existingNames={[]}
        testInitialSemesterId="sem1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/spring 2026/i), { target: { value: 'Fail Demo 3' } });
    await user.click(screen.getByRole('button', { name: /Start/i }));

    await act(async () => {
      jest.advanceTimersByTime(40000);
    });

    const generateButton = screen.getByRole('button', { name: /Generate Schedule/i });
    expect(generateButton).toBeEnabled();

    await user.click(generateButton);

    const candidateSteps = await screen.findAllByText(/Candidate Filtering/i);
    expect(candidateSteps.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Exam cannot be assigned\.\s*No valid candidate exists\.\s*Generation stopped\./i)).toBeInTheDocument();
    expect(handleGenerated).not.toHaveBeenCalled();
  });
});

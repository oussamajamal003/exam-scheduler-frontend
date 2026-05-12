import { useQuery } from "@tanstack/react-query";
import { fetchExams } from "../../api/examsApi";

export const useExams = () => {
  return useQuery({
    queryKey: ["exams"],
    queryFn: () => fetchExams(),
  });
};
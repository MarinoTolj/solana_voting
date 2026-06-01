"use client";

import { useCallback, useState } from "react";

export type PollFormValues = {
  pollName: string;
  pollDesc: string;
  duration: string;
  candidateInput: string;
  candidates: string[];
};

export type PollFormErrors = {
  pollName?: string;
  pollDesc?: string;
  duration?: string;
  options?: string;
  candidateInput?: string;
};

const MIN_CANDIDATES = 2;

export function useInitPollForm() {
  const [values, setValues] = useState<PollFormValues>({
    pollName: "",
    pollDesc: "",
    duration: "",
    candidateInput: "",
    candidates: [],
  });

  const [errors, setErrors] = useState<PollFormErrors>({});

  const setPollName = useCallback((pollName: string) => {
    setValues((current) => ({ ...current, pollName }));
    setErrors((current) => ({ ...current, pollName: undefined }));
  }, []);

  const setPollDesc = useCallback((pollDesc: string) => {
    setValues((current) => ({ ...current, pollDesc }));
    setErrors((current) => ({ ...current, pollDesc: undefined }));
  }, []);

  const setDuration = useCallback((duration: string) => {
    setValues((current) => ({ ...current, duration }));
    setErrors((current) => ({ ...current, duration: undefined }));
  }, []);

  const setCandidateInput = useCallback((candidateInput: string) => {
    setValues((current) => ({ ...current, candidateInput }));
    setErrors((current) => ({ ...current, candidateInput: undefined }));
  }, []);

  const addCandidate = useCallback(() => {
    const trimmedInput = values.candidateInput.trim();

    if (!trimmedInput) {
      setErrors((current) => ({
        ...current,
        candidateInput: "Option name cannot be empty",
      }));
      return false;
    }

    if (trimmedInput.length > 32) {
      setErrors((current) => ({
        ...current,
        candidateInput: "Max len for option name is 32 characters",
      }));
      return false;
    }

    if (
      values.candidates.some(
        (candidate) => candidate.toLowerCase() === trimmedInput.toLowerCase()
      )
    ) {
      setErrors((current) => ({
        ...current,
        candidateInput: "This option already exists",
      }));
      return false;
    }

    setValues((current) => ({
      ...current,
      candidates: [...current.candidates, trimmedInput],
      candidateInput: "",
    }));
    setErrors((current) => ({
      ...current,
      candidateInput: undefined,
      options: undefined,
    }));
    return true;
  }, [values.candidateInput, values.candidates]);

  const removeCandidate = useCallback((index: number) => {
    setValues((current) => ({
      ...current,
      candidates: current.candidates.filter(
        (_, candidateIndex) => candidateIndex !== index
      ),
    }));
    setErrors((current) => ({ ...current, options: undefined }));
  }, []);

  const validate = useCallback(() => {
    const nextErrors: PollFormErrors = {};

    if (!values.pollName.trim()) {
      nextErrors.pollName = "Poll name is required";
    }
    if (values.pollName.length > 32) {
      nextErrors.pollName = "Poll name must be at most 32 characters";
    }

    if (!values.pollDesc.trim()) {
      nextErrors.pollDesc = "Poll description is required";
    }
    if (values.pollDesc.length > 100) {
      nextErrors.pollDesc = "Poll description must be at most 100 characters";
    }

    if (!values.duration.trim()) {
      nextErrors.duration = "Duration is required";
    } else {
      const durationMs = Number(values.duration) * 60 * 1000;
      if (Number.isNaN(durationMs) || durationMs <= 0) {
        nextErrors.duration = "Duration must be greater than 0";
      }
    }

    if (values.candidates.length < MIN_CANDIDATES) {
      nextErrors.options = `You must provide at least ${MIN_CANDIDATES} options. Current: ${values.candidates.length}`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [
    values.candidates.length,
    values.duration,
    values.pollDesc,
    values.pollName,
  ]);

  return {
    values,
    errors,
    setPollName,
    setPollDesc,
    setDuration,
    setCandidateInput,
    addCandidate,
    removeCandidate,
    validate,
  };
}

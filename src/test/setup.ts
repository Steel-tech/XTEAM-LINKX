import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock("process", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "file:./test.db"
  }
}));

// Global test utilities
global.mockFormData = (data: Record<string, any>) => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => formData.append(key, v));
    } else {
      formData.append(key, value);
    }
  });
  return formData;
};

// Type declarations for global test utilities
declare global {
  function mockFormData(data: Record<string, any>): FormData;
}
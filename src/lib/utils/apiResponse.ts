import { NextResponse } from "next/server";

/**
 * Standardized API Response Builders for DivyaDrishti.
 * Enforces a strict contract between Backend and UI.
 */

export type ErrorType = "NETWORK_ERROR" | "DATA_MALFORMATION" | "ENGINE_FAILURE" | "INTERNAL_ERROR";

export function buildSuccessResponse(data: any) {
  return NextResponse.json({
    success: true,
    data
  });
}

export function buildErrorResponse(code: ErrorType, message: string, status: number = 500) {
  return NextResponse.json({
    success: false,
    error: {
      code,
      message
    }
  }, { status });
}

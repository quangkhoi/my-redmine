export function normalizeApiError(status: number): string {
  switch (status) {
    case 400:
      return "The request is invalid.";
    case 401:
      return "You need to sign in.";
    case 403:
      return "You do not have access.";
    case 404:
      return "The requested task view was not found.";
    default:
      return "Something went wrong.";
  }
}

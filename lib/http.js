export function json(status, body) {
  return Response.json(body, { status });
}

export function methodNotAllowed() {
  return json(405, { error: 'method_not_allowed' });
}

export function errorResponse(err) {
  const status = Number(err?.status) || 500;
  const code = err?.code || (status === 500 ? 'internal_error' : 'request_failed');
  if (status >= 500) {
    console.error(err);
  }
  return json(status, { error: code, message: status >= 500 ? 'Server error' : err.message });
}

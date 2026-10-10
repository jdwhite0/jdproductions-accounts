import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PageHead, Grid, StatCard } from "@/views/member/_ui";

const TYPES = [
  ["active", "Active opening"],
  ["internship", "Internship"],
  ["upcoming", "Upcoming"],
  ["talent_community", "Talent community"],
];

const STAGES = [
  ["application_received", "Received"],
  ["initial_review", "Review"],
  ["screening", "Screening"],
  ["interview", "Interview"],
  ["final_evaluation", "Evaluation"],
  ["offer", "Offer"],
  ["hired", "Hired"],
  ["future_consideration", "Future consideration"],
  ["rejected", "Rejected"],
  ["withdrawn", "Withdrawn"],
  ["archived", "Archived"],
];

const STATUS_ACTIONS = {
  draft: [
    ["published", "Publish"],
    ["archived", "Archive"],
  ],
  published: [
    ["paused", "Pause"],
    ["closed", "Close"],
    ["draft", "Unpublish"],
    ["archived", "Archive"],
  ],
  paused: [
    ["published", "Publish"],
    ["closed", "Close"],
    ["archived", "Archive"],
  ],
  closed: [
    ["published", "Reopen"],
    ["draft", "Return to draft"],
    ["archived", "Archive"],
  ],
  archived: [
    ["draft", "Reopen as draft"],
    ["published", "Publish"],
  ],
};

const DEPARTMENTS = [
  "Technology & Intelligence",
  "Product & Engineering",
  "Business Development & Partnerships",
  "Operations & Corporate Development",
  "Finance & Economic Systems",
  "Communications & Media",
  "Advanced Industries & Research",
];

async function callApi(getToken, path, options = {}) {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };
  if (options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(`/api/recruiting/${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (options.raw) return response;
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.message || "The recruiting request failed.");
  return data;
}

export default function RecruitingDashboard() {
  const { getToken } = useAuth();
  const [overview, setOverview] = useState(null);
  const [report, setReport] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [retention, setRetention] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    departmentName: DEPARTMENTS[0],
    opportunityType: "upcoming",
    summary: "",
  });

  const load = useCallback(async () => {
    setError("");
    const [nextOverview, nextReport, nextJobs, nextApplications, nextMessages] =
      await Promise.all([
        callApi(getToken, "admin/overview"),
        callApi(getToken, "admin/reports"),
        callApi(getToken, "admin/opportunities"),
        callApi(getToken, "admin/applications"),
        callApi(getToken, "admin/communications"),
      ]);
    setOverview(nextOverview);
    setReport(nextReport);
    setOpportunities(nextJobs.opportunities || []);
    setApplications(nextApplications.applications || []);
    setCommunications(nextMessages.communications || []);
    try {
      const nextRetention = await callApi(getToken, "admin/retention");
      setRetention(nextRetention.requests || []);
    } catch {
      setRetention([]);
    }
  }, [getToken]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  async function run(action) {
    setNotice("");
    setError("");
    try {
      await action();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openApplication(id) {
    setSelectedId(id);
    setDetail(null);
    const next = await callApi(getToken, `admin/applications/${id}`);
    setDetail(next);
  }

  async function downloadExport() {
    const response = await callApi(getToken, "admin/export", { raw: true });
    if (!response.ok) throw new Error("Export failed.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recruiting-applications.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadFile(id, filename) {
    const response = await callApi(getToken, `admin/attachments/${id}`, {
      raw: true,
    });
    if (!response.ok) throw new Error("The file could not be opened.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "resume";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Box>
      <PageHead
        eyebrow="Recruiting"
        title="Careers"
        subtitle="JD Productions opportunities, applications, and pipeline. Publishing does not require a payroll budget, and it is not an employment offer."
        action={
          <Button variant="outlined" onClick={() => run(downloadExport)}>
            Export
          </Button>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      <Alert severity="info" sx={{ mb: 2 }}>
        Candidate messages are recorded here. This environment does not send
        email.
      </Alert>
      <Grid min={180} sx={{ mb: 3 }}>
        <StatCard
          label="Published"
          value={overview ? overview.openPositions : "…"}
        />
        <StatCard
          label="Applications"
          value={overview ? overview.totalApplications : "…"}
        />
        <StatCard
          label="Awaiting review"
          value={overview ? overview.awaitingReview : "…"}
        />
        <StatCard
          label="Days to fill"
          value={report?.averageDaysToFill ?? "—"}
          hint="From recorded hires"
        />
      </Grid>

      <Typography variant="h4" sx={{ mb: 1 }}>
        Opportunities
      </Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {opportunities.map((job) => (
          <Card key={job.id} variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                sx={{
                  justifyContent: "space-between",
                  alignItems: { md: "center" },
                }}
              >
                <Box>
                  <Typography variant="h5">{job.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.departmentName || "No department"} ·{" "}
                    {job.opportunityType} · {job.status}
                    {job.slug ? ` · /careers/${job.slug}` : ""}
                  </Typography>
                  {(job.unresolvedTerms || []).length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Unresolved: {job.unresolvedTerms.join(", ")}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <TextField
                    select
                    size="small"
                    label="Type"
                    value={job.opportunityType}
                    onChange={(event) =>
                      run(() =>
                        callApi(getToken, `admin/opportunities/${job.id}`, {
                          method: "POST",
                          body: { opportunityType: event.target.value },
                        }),
                      )
                    }
                  >
                    {TYPES.map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                  {(STATUS_ACTIONS[job.status] || []).map(([status, label]) => (
                    <Button
                      key={status}
                      size="small"
                      variant={
                        status === "published" ? "contained" : "outlined"
                      }
                      onClick={() =>
                        run(() =>
                          callApi(
                            getToken,
                            `admin/opportunities/${job.id}/status`,
                            { method: "POST", body: { status } },
                          ),
                        )
                      }
                    >
                      {label}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            New opportunity
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              label="Title"
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />
            <TextField
              select
              label="Department"
              value={draft.departmentName}
              onChange={(event) =>
                setDraft({ ...draft, departmentName: event.target.value })
              }
            >
              {DEPARTMENTS.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Opportunity type"
              value={draft.opportunityType}
              onChange={(event) =>
                setDraft({ ...draft, opportunityType: event.target.value })
              }
            >
              {TYPES.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Summary"
              multiline
              minRows={2}
              value={draft.summary}
              onChange={(event) =>
                setDraft({ ...draft, summary: event.target.value })
              }
            />
            <Button
              variant="contained"
              disabled={!draft.title.trim()}
              onClick={() =>
                run(async () => {
                  await callApi(getToken, "admin/opportunities", {
                    method: "POST",
                    body: draft,
                  });
                  setDraft({ ...draft, title: "", summary: "" });
                  setNotice(
                    "Draft saved. Publish it when the description is ready. Compensation is left unset.",
                  );
                })
              }
            >
              Save draft
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h4" sx={{ mb: 1 }}>
        Applications
      </Typography>
      <Stack spacing={1} sx={{ mb: 2 }}>
        {applications.length === 0 && (
          <Typography color="text.secondary">No applications yet.</Typography>
        )}
        {applications.map((item) => (
          <Button
            key={item.id}
            variant={item.id === selectedId ? "contained" : "text"}
            onClick={() =>
              openApplication(item.id).catch((err) => setError(err.message))
            }
            sx={{ justifyContent: "space-between" }}
          >
            <span>
              {item.candidateName} · {item.jobTitle}
            </span>
            <span>
              {item.referenceCode} · {item.statusLabel}
            </span>
          </Button>
        ))}
      </Stack>

      {detail && (
        <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h5">{detail.candidate.fullName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {detail.candidate.email}
              {detail.candidate.phone ? ` · ${detail.candidate.phone}` : ""}
              {detail.candidate.location
                ? ` · ${detail.candidate.location}`
                : ""}
              {detail.candidate.portfolioUrl
                ? ` · ${detail.candidate.portfolioUrl}`
                : ""}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {detail.jobTitle} · {detail.referenceCode} · {detail.statusLabel}
            </Typography>
            {(detail.answers || []).map((answer) => (
              <Typography key={answer.id || answer.questionId} variant="body2">
                {answer.prompt ? `${answer.prompt}: ` : ""}
                {Array.isArray(answer.value)
                  ? answer.value.join(", ")
                  : String(answer.value ?? "")}
              </Typography>
            ))}
            <Stack direction="row" spacing={1} sx={{ my: 1, flexWrap: "wrap" }}>
              {(detail.attachments || []).map((file) => (
                <Button
                  key={file.id}
                  size="small"
                  onClick={() =>
                    downloadFile(file.id, file.filename).catch((err) =>
                      setError(err.message),
                    )
                  }
                >
                  {file.filename} ({file.scanStatus || "unscanned"})
                </Button>
              ))}
            </Stack>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{ mt: 1 }}
            >
              <TextField
                select
                size="small"
                label="Stage"
                value={detail.stage}
                onChange={(event) =>
                  run(async () => {
                    await callApi(
                      getToken,
                      `admin/applications/${detail.id}/stage`,
                      { method: "POST", body: { stage: event.target.value } },
                    );
                    await openApplication(detail.id);
                  })
                }
              >
                {STAGES.map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <NoteForm
                onSave={(body) =>
                  run(async () => {
                    await callApi(
                      getToken,
                      `admin/applications/${detail.id}/notes`,
                      { method: "POST", body: { body } },
                    );
                    await openApplication(detail.id);
                  })
                }
              />
            </Stack>
            {(detail.notes || []).map((note) => (
              <Typography key={note.id} variant="body2" sx={{ mt: 1 }}>
                Internal note: {note.body}
              </Typography>
            ))}
            <InterviewForm
              onSave={(body) =>
                run(async () => {
                  await callApi(
                    getToken,
                    `admin/applications/${detail.id}/interviews`,
                    { method: "POST", body },
                  );
                  setNotice(
                    "Interview recorded. No calendar invitation was sent.",
                  );
                  await openApplication(detail.id);
                })
              }
            />
            <MessageForm
              onSave={(body) =>
                run(async () => {
                  const saved = await callApi(
                    getToken,
                    `admin/applications/${detail.id}/communications`,
                    { method: "POST", body },
                  );
                  setNotice(
                    saved.delivered
                      ? "Unexpected delivery flag."
                      : "Message recorded. It was not emailed.",
                  );
                })
              }
            />
          </CardContent>
        </Card>
      )}

      <Typography variant="h4" sx={{ mb: 1 }}>
        Recorded messages
      </Typography>
      {communications.length === 0 && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          None recorded.
        </Typography>
      )}
      {communications.map((item) => (
        <Typography key={item.id} variant="body2">
          {item.templateKey} · {item.deliveryStatus} · not emailed
        </Typography>
      ))}

      {report && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Volume {report.applicationVolume}. {report.note}
        </Typography>
      )}

      {retention.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Privacy requests
          </Typography>
          {retention.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 1 }}
            >
              <Typography variant="body2">
                {item.requestType} · {item.status}
              </Typography>
              {item.requestType === "deletion" &&
                item.status !== "completed" && (
                  <Button
                    size="small"
                    onClick={() => {
                      if (!window.confirm("Redact this candidate record?"))
                        return;
                      run(() =>
                        callApi(
                          getToken,
                          `admin/retention/${item.id}/complete`,
                          { method: "POST" },
                        ),
                      );
                    }}
                  >
                    Complete deletion
                  </Button>
                )}
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}

function NoteForm({ onSave }) {
  const [body, setBody] = useState("");
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flex: 1 }}>
      <TextField
        size="small"
        label="Internal note"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        fullWidth
      />
      <Button
        variant="outlined"
        disabled={!body.trim()}
        onClick={() => {
          onSave(body.trim());
          setBody("");
        }}
      >
        Save note
      </Button>
    </Stack>
  );
}

function InterviewForm({ onSave }) {
  const [interviewerClerkUserId, setInterviewer] = useState("");
  const [startsAt, setStartsAt] = useState("");
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2 }}>
      <TextField
        size="small"
        label="Interviewer Clerk user id"
        value={interviewerClerkUserId}
        onChange={(event) => setInterviewer(event.target.value)}
      />
      <TextField
        size="small"
        label="Start"
        type="datetime-local"
        value={startsAt}
        onChange={(event) => setStartsAt(event.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <Button
        variant="outlined"
        disabled={!interviewerClerkUserId.trim()}
        onClick={() =>
          onSave({
            interviewerClerkUserId: interviewerClerkUserId.trim(),
            startsAt: startsAt ? new Date(startsAt).toISOString() : null,
          })
        }
      >
        Record interview
      </Button>
    </Stack>
  );
}

function MessageForm({ onSave }) {
  const [templateKey, setTemplateKey] = useState("status_update");
  const [body, setBody] = useState("");
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 2 }}>
      <TextField
        select
        size="small"
        label="Record"
        value={templateKey}
        onChange={(event) => setTemplateKey(event.target.value)}
      >
        <MenuItem value="status_update">Status update</MenuItem>
        <MenuItem value="interview_invitation">Interview invitation</MenuItem>
        <MenuItem value="interview_reschedule">Reschedule</MenuItem>
        <MenuItem value="offer">Offer note</MenuItem>
      </TextField>
      <TextField
        size="small"
        label="Message text"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        fullWidth
      />
      <Button
        variant="outlined"
        disabled={!body.trim()}
        onClick={() => {
          onSave({ templateKey, body: body.trim() });
          setBody("");
        }}
      >
        Record message
      </Button>
    </Stack>
  );
}

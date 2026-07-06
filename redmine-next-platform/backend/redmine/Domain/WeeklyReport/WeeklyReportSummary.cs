namespace Redmine.Domain.WeeklyReport;

public sealed record WeeklyReportSummary(
    string UserName,
    bool HasPrevious,
    WeeklyReportRange Range,
    WeeklyReportRange ExportRange,
    IReadOnlyList<WeeklyReportItem> PrevCsharp,
    IReadOnlyList<WeeklyReportItem> PrevWeb,
    IReadOnlyList<WeeklyReportItem> CurrentCsharp,
    IReadOnlyList<WeeklyReportItem> CurrentWeb);

public sealed record WeeklyReportRange(string From, string To);

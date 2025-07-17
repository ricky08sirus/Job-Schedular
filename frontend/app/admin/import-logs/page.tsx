"use client";
import { useEffect, useState } from "react";
import "./importLogs.css"; // Custom CSS

interface ILog {
	_id: string;
	total: number;
	new: number;
	updated: number;
	failed: number;
	errors: string[];
	createdAt: string;
}

export default function ImportLogsPage() {
	const [logs, setLogs] = useState<ILog[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/import-logs`)
			.then((res) => res.json())
			.then((data) => {
				if (data.success && Array.isArray(data.logs)) setLogs(data.logs);
				else setError("! Bad response from API");
			})
			.catch((err) => setError(err.message));
	}, []);

	return (
		<div className="import-logs-container">
			<h1>Import Summary Logs</h1>
			{error && <p className="error-msg">{error}</p>}
			{!error && logs.length === 0 && <p className="no-logs">No logs yet.</p>}
			{logs.length > 0 && (
				<table className="import-logs-table">
					<thead>
						<tr>
							<th>URL</th>
							<th>Total</th>
							<th className="new">New</th>
							<th className="updated">Updated</th>
							<th className="failed">Failed</th>
							<th>Error</th>
							<th>ImportDateTime</th>
						</tr>
					</thead>
					<tbody>
						{logs.map((log) => (
							<tr key={log._id}>
								<td>
									{log.errors[0]
										?.match(/\((.*?)\)/)?.[1]
										?.replace("https://", "")
										.split("/")
										.slice(0, 3)
										.join("/")}
								</td>
								<td>{log.total}</td>
								<td className="new">{log.new}</td>
								<td className="updated">{log.updated}</td>
								<td className="failed">{log.failed}</td>
								<td>
									{log.errors.slice(0, 2).join(" | ")}
									{log.errors.length > 2 && " ..."}
								</td>
								<td>{new Date(log.createdAt).toLocaleString()}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

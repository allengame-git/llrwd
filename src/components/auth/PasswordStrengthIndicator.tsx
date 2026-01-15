"use client";

import { getPasswordRequirements } from "@/lib/password-policy";

interface PasswordStrengthIndicatorProps {
    password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const requirements = getPasswordRequirements();

    if (!password) return null;

    const passedCount = requirements.filter(r => r.check(password)).length;
    const totalCount = requirements.length;
    const percentage = (passedCount / totalCount) * 100;

    const getStrengthColor = () => {
        if (percentage >= 100) return "rgb(34, 197, 94)"; // green
        if (percentage >= 75) return "rgb(234, 179, 8)"; // yellow
        if (percentage >= 50) return "rgb(249, 115, 22)"; // orange
        return "rgb(239, 68, 68)"; // red
    };

    const getStrengthLabel = () => {
        if (percentage >= 100) return "強";
        if (percentage >= 75) return "中";
        if (percentage >= 50) return "弱";
        return "非常弱";
    };

    return (
        <div style={{ marginTop: "0.5rem" }}>
            {/* Strength Bar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem"
            }}>
                <div style={{
                    flex: 1,
                    height: "4px",
                    backgroundColor: "var(--color-border)",
                    borderRadius: "2px",
                    overflow: "hidden"
                }}>
                    <div style={{
                        width: `${percentage}%`,
                        height: "100%",
                        backgroundColor: getStrengthColor(),
                        transition: "width 0.3s, background-color 0.3s"
                    }} />
                </div>
                <span style={{
                    fontSize: "0.75rem",
                    color: getStrengthColor(),
                    fontWeight: 600,
                    minWidth: "50px"
                }}>
                    {getStrengthLabel()}
                </span>
            </div>

            {/* Requirements List */}
            <div style={{
                fontSize: "0.8rem",
                color: "var(--color-text-muted)",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem"
            }}>
                {requirements.map(req => {
                    const passed = req.check(password);
                    return (
                        <div key={req.key} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            color: passed ? "rgb(34, 197, 94)" : "var(--color-text-muted)"
                        }}>
                            <span style={{ fontSize: "0.9rem" }}>
                                {passed ? "✓" : "○"}
                            </span>
                            <span>{req.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import React from "react";

const LinkPreviewCard = ({
    previewLoading,
    previewError,
    linkPreview
}) => {

    if (previewLoading) {
        return (
            <div
                style={{
                    marginTop: "15px",
                    color: "#6b7280",
                    fontSize: ".9rem"
                }}
            >
                Fetching article preview...
            </div>
        );
    }

    if (previewError) {
        return (
            <div
                style={{
                    marginTop: "15px",
                    color: "#dc2626",
                    fontSize: ".9rem"
                }}
            >
                {previewError}
            </div>
        );
    }

    if (!linkPreview) return null;

    return (
        <div
            style={{
                marginTop: "20px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "16px",
                display: "flex",
                gap: "16px",
                alignItems: "center",
                background: "#fafafa"
            }}
        >
            {linkPreview.image && (
                <img
                    src={linkPreview.image}
                    alt="Preview"
                    style={{
                        width: "120px",
                        height: "90px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        flexShrink: 0
                    }}
                />
            )}

            <div>
                <h5
                    style={{
                        margin: "0 0 6px",
                        fontWeight: 600
                    }}
                >
                    {linkPreview.title}
                </h5>

                {linkPreview.site && (
                    <p
                        style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: ".9rem"
                        }}
                    >
                        {linkPreview.site}
                    </p>
                )}
            </div>
        </div>
    );
};

export default LinkPreviewCard;
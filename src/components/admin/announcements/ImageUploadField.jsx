import React from "react";

const ImageUploadField = ({
    isEditMode,
    imageError,
    imageFile,
    existingImageUrl,
    removeImage,
    handleImageChange,
    setRemoveImage
}) => {
    return (
        <div className="form-field">
            <label className="form-label">
                Upload Image (JPEG only)
            </label>

            <input
                type="file"
                accept="image/jpeg"
                className="form-input"
                onChange={handleImageChange}
            />

            {imageError && (
                <span
                    style={{
                        color: "red",
                        fontSize: ".8rem"
                    }}
                >
                    {imageError}
                </span>
            )}

            {isEditMode &&
                existingImageUrl &&
                !imageFile &&
                !removeImage && (
                    <div
                        style={{
                            marginTop: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >
                        <img
                            src={existingImageUrl}
                            alt="Current"
                            style={{
                                width: "56px",
                                height: "56px",
                                objectFit: "cover",
                                borderRadius: "6px",
                                border: "1px solid #e5e7eb"
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => setRemoveImage(true)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: ".8rem",
                                padding: 0
                            }}
                        >
                            Remove current image
                        </button>
                    </div>
                )}

            {isEditMode && removeImage && (
                <div
                    style={{
                        marginTop: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: ".8rem",
                        color: "#6b7280"
                    }}
                >
                    Current image will be removed on save.

                    <button
                        type="button"
                        onClick={() => setRemoveImage(false)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#6B2C3E",
                            cursor: "pointer",
                            fontSize: ".8rem",
                            padding: 0
                        }}
                    >
                        Undo
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageUploadField;
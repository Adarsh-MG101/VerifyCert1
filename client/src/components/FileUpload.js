"use client";

const FileUpload = ({
    file,
    onFileChange,
    accept = ".docx",
    placeholder = "Select or drop file",
    icon = "📁",
    selectedIcon = "📄",
    helperText = "Max file size 10MB",
    rowCountText = ""
}) => {
    return (
        <div className="relative group">
            <input
                type="file"
                accept={accept}
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`p-8 border-2 border-dashed rounded-xl text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-border group-hover:border-primary/50 bg-gray-50'}`}>
                <div className="text-4xl mb-3">{file ? selectedIcon : icon}</div>
                <div className="font-medium text-gray-700">{file ? file.name : placeholder}</div>
                {file && rowCountText && (
                    <div className="mt-2 text-xs font-bold text-primary uppercase tracking-widest">
                        {rowCountText}
                    </div>
                )}
                <div className="text-sm text-gray-400 mt-1">{file ? `${(file.size / 1024).toFixed(2)} KB` : helperText}</div>
            </div>
        </div>
    );
};

export default FileUpload;

export default function UserStatusSelect({
    value,
    onChange
}) {
    return (
        <select
            value={value}
            onChange={onChange}
            className="form-select text-xs"
            style={{ padding: "4px 8px" }}
        >
            <option value="Active">Active</option>
            <option value="Disabled">Disabled</option>
            <option value="Banned">Banned</option>
        </select>
    );
}
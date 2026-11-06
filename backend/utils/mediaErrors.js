// A report's photo or video travels as base64 inside the JSON body and is
// saved in the report row, so a big file can be refused twice: by the body
// parser (over 75 MB: "entity.too.large") or by MySQL (over its
// max_allowed_packet: ER_NET_PACKET_TOO_LARGE). Both get the same answer,
// with a code the report forms turn into a "file too large" message.
const MEDIA_TOO_LARGE = {
    success: false,
    code: "MEDIA_TOO_LARGE",
    message: "The photo or video is too large to send. Please attach a smaller file."
};

const isMediaTooLarge = (err) => Boolean(err) && (
    err.code === "ER_NET_PACKET_TOO_LARGE"
    || err.errno === 1153
    || err.type === "entity.too.large"
);

// In a report controller's catch: answers 413 and returns true when the
// error was the file's size.
const sendIfMediaTooLarge = (res, err) => {
    if (!isMediaTooLarge(err)) return false;
    res.status(413).json(MEDIA_TOO_LARGE);
    return true;
};

module.exports = { MEDIA_TOO_LARGE, isMediaTooLarge, sendIfMediaTooLarge };

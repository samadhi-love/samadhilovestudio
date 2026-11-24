// Owner page helper: makes photos smaller on the phone before sending (faster uploads,
// and it removes hidden details such as the GPS location), and shows "Sending…".
(function () {
  const MAX = 2000, QUALITY = 0.86;

  async function shrink(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((done) => canvas.toBlob(done, "image/jpeg", QUALITY));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  }

  document.querySelectorAll("form[data-owner-form]").forEach((form) => {
    let ready = false;
    form.addEventListener("submit", async (event) => {
      const sending = form.querySelector(".owner-sending");
      if (sending) sending.hidden = false;
      form.querySelectorAll("button[type=submit]").forEach((b) => { b.setAttribute("aria-disabled", "true"); });
      if (ready) return;
      const inputs = [...form.querySelectorAll("input[type=file][data-resize]")].filter((i) => i.files && i.files.length);
      if (!inputs.length || typeof DataTransfer === "undefined" || typeof createImageBitmap === "undefined") return;
      event.preventDefault();
      const submitter = event.submitter;
      try {
        for (const input of inputs) {
          const list = new DataTransfer();
          for (const f of input.files) list.items.add(await shrink(f).catch(() => f));
          input.files = list.files;
        }
      } catch (err) { /* send the photos as they are */ }
      ready = true;
      if (submitter && submitter.name) {
        const keep = document.createElement("input");
        keep.type = "hidden"; keep.name = submitter.name; keep.value = submitter.value;
        form.appendChild(keep);
      }
      form.submit();
    });
  });
})();

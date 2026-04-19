(function () {
  const API = "";

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function showAlert(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden", "alert-success", "alert-error");
    el.classList.add(type === "success" ? "alert-success" : "alert-error");
  }

  function hideAlert(el) {
    if (!el) return;
    el.classList.add("hidden");
    el.textContent = "";
  }

  function clearRegisterErrors() {
    ["name", "age", "gender", "bloodGroup", "phone", "city", "lastDonationDate"].forEach(
      (id) => {
        const err = document.getElementById("err-" + id);
        if (err) err.textContent = "";
      }
    );
  }

  function clearDonorFormErrors() {
    ["name", "age", "gender", "bloodGroup", "phone", "city"].forEach((id) => {
      const err = document.getElementById("d-err-" + id);
      if (err) err.textContent = "";
    });
  }

  function validateDonorPayload(data, prefix) {
    const errs = {};
    const getErrId = (field) => (prefix === "d" ? "d-err-" + field : "err-" + field);

    const name = (data.name || "").trim();
    if (!name) errs[getErrId("name")] = "Name is required.";

    const ageNum = Number(data.age);
    if (data.age === "" || data.age === undefined || data.age === null) {
      errs[getErrId("age")] = "Age is required.";
    } else if (!Number.isFinite(ageNum) || ageNum < 18) {
      errs[getErrId("age")] = "Age must be at least 18.";
    }

    const gender = (data.gender || "").trim();
    if (!gender) errs[getErrId("gender")] = "Please select gender.";

    const bloodGroup = (data.bloodGroup || "").trim();
    if (!bloodGroup) errs[getErrId("bloodGroup")] = "Please select blood group.";

    const phone = String(data.phone || "").replace(/\D/g, "");
    if (phone.length !== 10)
      errs[getErrId("phone")] = "Phone must be exactly 10 digits.";

    const city = (data.city || "").trim();
    if (!city) errs[getErrId("city")] = "City is required.";

    if (data.lastDonationDate && String(data.lastDonationDate).trim() !== "") {
      const d = new Date(data.lastDonationDate);
      if (Number.isNaN(d.getTime()))
        errs[getErrId("lastDonationDate")] = "Invalid date.";
    }

    return errs;
  }

  function applyErrors(errs) {
    Object.keys(errs).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = errs[id];
    });
  }

  function isoDateOnly(isoOrDate) {
    if (!isoOrDate) return "";
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDisplayDate(isoOrDate) {
    if (!isoOrDate) return "—";
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    hideAlert($("#form-alert"));
    clearRegisterErrors();

    const form = e.target;
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      age: fd.get("age"),
      gender: fd.get("gender"),
      bloodGroup: fd.get("bloodGroup"),
      phone: fd.get("phone"),
      city: fd.get("city"),
      lastDonationDate: fd.get("lastDonationDate") || "",
    };

    const errs = validateDonorPayload(payload, "");
    if (Object.keys(errs).length) {
      applyErrors(errs);
      showAlert($("#form-alert"), "Please fix the errors below.", "error");
      return;
    }

    const body = {
      name: payload.name.trim(),
      age: Number(payload.age),
      gender: payload.gender.trim(),
      bloodGroup: payload.bloodGroup.trim(),
      phone: String(payload.phone).replace(/\D/g, ""),
      city: payload.city.trim(),
      lastDonationDate:
        payload.lastDonationDate && String(payload.lastDonationDate).trim() !== ""
          ? payload.lastDonationDate
          : "",
    };

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;

    try {
      const res = await fetch(API + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        const msg =
          (data.errors && data.errors.join(" ")) ||
          "Registration failed. Please try again.";
        showAlert($("#form-alert"), msg, "error");
        return;
      }

      showAlert(
        $("#form-alert"),
        data.message || "Registered successfully. Thank you for donating!",
        "success"
      );
      form.reset();
    } catch (err) {
      showAlert(
        $("#form-alert"),
        "Could not reach server. Is the API running?",
        "error"
      );
    } finally {
      btn.disabled = false;
    }
  }

  function renderResults(donors, container, statusEl) {
    container.innerHTML = "";
    if (!donors || donors.length === 0) {
      statusEl.textContent = "No donors match your filters.";
      container.innerHTML =
        '<p class="empty-state">No results. Try different filters or register as a donor.</p>';
      return;
    }

    statusEl.textContent = `${donors.length} donor(s) found.`;
    const frag = document.createDocumentFragment();

    donors.forEach((d) => {
      const card = document.createElement("article");
      card.className = "donor-card";
      card.innerHTML = `
        <h2>${escapeHtml(d.name)}</h2>
        <dl>
          <dt>Blood</dt><dd>${escapeHtml(d.bloodGroup)}</dd>
          <dt>City</dt><dd>${escapeHtml(d.city)}</dd>
          <dt>Phone</dt><dd>${escapeHtml(d.phone)}</dd>
          <dt>Last donated</dt><dd>${escapeHtml(formatDisplayDate(d.lastDonationDate))}</dd>
        </dl>
        <div class="card-actions">
          <a class="btn btn-outline btn-small" href="donor.html?id=${encodeURIComponent(
            d._id
          )}">Edit / delete</a>
        </div>
      `;
      frag.appendChild(card);
    });

    container.appendChild(frag);
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  async function fetchDonors(params, container, statusEl) {
    statusEl.textContent = "Loading…";
    container.innerHTML = "";

    const qs = new URLSearchParams();
    if (params.bloodGroup) qs.set("bloodGroup", params.bloodGroup);
    if (params.city) qs.set("city", params.city);

    try {
      const res = await fetch(API + "/donors?" + qs.toString());
      const data = await res.json();
      if (!res.ok || !data.ok) {
        statusEl.textContent = "Search failed.";
        container.innerHTML =
          '<p class="empty-state">Something went wrong. Try again.</p>';
        return;
      }
      renderResults(data.donors, container, statusEl);
    } catch {
      statusEl.textContent = "";
      container.innerHTML =
        '<p class="empty-state">Could not reach server. Start the backend and refresh.</p>';
    }
  }

  function initSearchPage() {
    const form = $("#search-form");
    const container = $("#results");
    const statusEl = $("#search-status");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const bloodGroup = $("#filter-blood").value.trim();
      const city = $("#filter-city").value.trim();
      fetchDonors({ bloodGroup, city }, container, statusEl);
    });

    fetchDonors(
      { bloodGroup: "", city: "" },
      container,
      statusEl
    );
  }

  function initRegisterPage() {
    const form = $("#register-form");
    const phone = $("#phone");
    if (phone) {
      phone.addEventListener("input", () => {
        phone.value = phone.value.replace(/\D/g, "").slice(0, 10);
      });
    }
    form.addEventListener("submit", handleRegisterSubmit);
  }

  async function initDonorPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const loadError = $("#load-error");
    const form = $("#donor-form");

    if (!id) {
      loadError.textContent = "Missing donor id.";
      loadError.classList.remove("hidden");
      return;
    }

    $("#donor-id").value = id;

    try {
      const res = await fetch(API + "/donor/" + encodeURIComponent(id));
      const data = await res.json();
      if (!res.ok || !data.ok || !data.donor) {
        loadError.textContent = "Donor not found.";
        loadError.classList.remove("hidden");
        return;
      }

      const d = data.donor;
      $("#d-name").value = d.name || "";
      $("#d-age").value = d.age ?? "";
      $("#d-gender").value = d.gender || "";
      $("#d-bloodGroup").value = d.bloodGroup || "";
      $("#d-phone").value = d.phone || "";
      $("#d-city").value = d.city || "";
      $("#d-lastDonationDate").value = isoDateOnly(d.lastDonationDate);

      form.classList.remove("hidden");
    } catch {
      loadError.textContent = "Could not load donor.";
      loadError.classList.remove("hidden");
      return;
    }

    $("#d-phone").addEventListener("input", function () {
      this.value = this.value.replace(/\D/g, "").slice(0, 10);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert($("#form-alert"));
      clearDonorFormErrors();

      const fd = new FormData(form);
      const payload = {
        name: fd.get("name"),
        age: fd.get("age"),
        gender: fd.get("gender"),
        bloodGroup: fd.get("bloodGroup"),
        phone: fd.get("phone"),
        city: fd.get("city"),
        lastDonationDate: fd.get("lastDonationDate") || "",
      };

      const errs = validateDonorPayload(payload, "d");
      if (Object.keys(errs).length) {
        applyErrors(errs);
        showAlert($("#form-alert"), "Please fix the errors below.", "error");
        return;
      }

      const body = {
        name: payload.name.trim(),
        age: Number(payload.age),
        gender: payload.gender.trim(),
        bloodGroup: payload.bloodGroup.trim(),
        phone: String(payload.phone).replace(/\D/g, ""),
        city: payload.city.trim(),
        lastDonationDate:
          payload.lastDonationDate && String(payload.lastDonationDate).trim() !== ""
            ? payload.lastDonationDate
            : "",
      };

      const btn = form.querySelector('[type="submit"]');
      btn.disabled = true;

      try {
        const res = await fetch(
          API + "/donor/" + encodeURIComponent(id),
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          showAlert(
            $("#form-alert"),
            (data.errors && data.errors.join(" ")) || "Update failed.",
            "error"
          );
          return;
        }
        showAlert($("#form-alert"), data.message || "Saved.", "success");
      } catch {
        showAlert($("#form-alert"), "Could not reach server.", "error");
      } finally {
        btn.disabled = false;
      }
    });

    $("#btn-delete").addEventListener("click", async () => {
      if (!confirm("Delete this donor permanently?")) return;
      try {
        const res = await fetch(
          API + "/donor/" + encodeURIComponent(id),
          { method: "DELETE" }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          alert((data.errors && data.errors[0]) || "Could not delete.");
          return;
        }
        window.location.href = "search.html";
      } catch {
        alert("Could not reach server.");
      }
    });
  }

  function boot() {
    const page =
      document.body.getAttribute("data-page") ||
      document.body.className.replace("page-", "");

    if (page === "register") initRegisterPage();
    else if (page === "search") initSearchPage();
    else if (page === "donor") initDonorPage();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();

(() => {
  "use strict";
  document.documentElement.classList.replace("no-js", "js");
  const profile = window.HOMEPAGE || {};
  const byId = id => document.getElementById(id);
  const element = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const safeUrl = (value, allowMail = false) => {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (["https:", "http:"].includes(url.protocol) || (allowMail && url.protocol === "mailto:")) return url.href;
      // Relative assets also work when previewing index.html directly from disk.
      if (url.protocol === "file:" && !/^[a-z][a-z\d+.-]*:/i.test(value)) return url.href;
    } catch (_) { /* Invalid links are omitted. */ }
    return null;
  };
  const makeLink = (label, url, className) => {
    const link = element("a", className, label);
    link.href = url;
    if (/^https?:/.test(url) && new URL(url).origin !== location.origin) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    return link;
  };
  const textFields = { welcomeMessage: "welcome-message", position: "position", affiliation: "affiliation", portraitAffiliation: "portrait-affiliation", portraitSubject: "portrait-subject", education: "education-line", summary: "summary", biography: "biography", researchDescription: "research-description" };
  for (const [key, id] of Object.entries(textFields)) {
    if (typeof profile[key] === "string" && profile[key]) byId(id).textContent = profile[key];
  }
  if (Array.isArray(profile.supervisors) && profile.supervisors.length) {
    const supervision = byId("supervision");
    supervision.replaceChildren(document.createTextNode("I am supervised by "));
    profile.supervisors.forEach((person, index) => {
      if (index) supervision.append(document.createTextNode(index === profile.supervisors.length - 1 ? " and " : ", "));
      const url = safeUrl(person.url);
      supervision.append(url ? makeLink(person.name, url) : document.createTextNode(person.name));
    });
    supervision.append(document.createTextNode("."));
  }
  if (profile.internship && profile.internship.organization) {
    const internship = byId("internship");
    internship.replaceChildren(document.createTextNode(`I am currently interning at ${profile.internship.organization}`));
    const person = profile.internship.collaborator;
    if (person && person.name) {
      internship.append(document.createTextNode(", working with "));
      const url = safeUrl(person.url);
      internship.append(url ? makeLink(person.name, url) : document.createTextNode(person.name));
    }
    internship.append(document.createTextNode("."));
  }
  if (profile.name) {
    const name = byId("hero-name");
    name.classList.toggle("full-name", profile.name.length > 8);
    name.replaceChildren(document.createTextNode(profile.name), element("span", "name-period", "."));
    document.title = `${profile.name} | Personal Homepage`;
  }
  const portraitUrl = safeUrl(profile.portrait);
  if (portraitUrl) {
    const image = element("img");
    image.alt = `Portrait of ${profile.name || "Daryl"}`;
    image.src = portraitUrl;
    image.addEventListener("load", () => {
      byId("portrait-frame").replaceChildren(image);
      byId("portrait-frame").classList.add("has-photo");
    }, { once: true });
  }
  const contacts = [
    ["GitHub", safeUrl(profile.github), "primary-link"],
    ["Email", profile.email ? safeUrl(`mailto:${profile.email}`, true) : null, ""],
    ["Scholar", safeUrl(profile.scholar), ""],
    ["CV", safeUrl(profile.cv), ""]
  ];
  byId("profile-links").replaceChildren(...contacts.map(([label, url, style]) => {
    if (url) return makeLink(label, url, `profile-link ${style}`);
    const pending = element("span", "profile-link pending-link", label);
    pending.setAttribute("aria-disabled", "true");
    pending.title = `${label} to be added`;
    return pending;
  }));
  if (Array.isArray(profile.research) && profile.research.length) {
    const numerals = ["I", "II", "III", "IV", "V", "VI"];
    byId("research-grid").replaceChildren(...profile.research.map((entry, index) => {
      const article = element("article", "research-item");
      article.append(element("span", "research-index", numerals[index] || String(index + 1)), element("h3", "", entry.title), element("p", "", entry.description));
      return article;
    }));
  }
  if (Array.isArray(profile.publications) && profile.publications.length) {
    byId("publication-list").replaceChildren(...profile.publications.map(paper => {
      const imageUrl = safeUrl(paper.image);
      const article = element("article", `publication-card${imageUrl ? "" : " no-image"}`);
      if (imageUrl) {
        const image = element("img", "publication-image");
        image.src = imageUrl;
        image.alt = paper.imageAlt || `${paper.title} overview`;
        image.loading = "lazy";
        article.append(image);
      }
      const content = element("div");
      content.append(element("h3", "publication-title", paper.title));
      if (Array.isArray(paper.authors) && paper.authors.length) {
        const authors = element("p", "publication-authors");
        paper.authors.forEach((author, index) => {
          if (index) authors.append(document.createTextNode(", "));
          authors.append(author === paper.highlightAuthor ? element("strong", "", author) : document.createTextNode(author));
        });
        content.append(authors);
      } else if (typeof paper.authors === "string") content.append(element("p", "publication-authors", paper.authors));
      if (paper.venue) content.append(element("span", "publication-venue", paper.venue));
      const links = element("div", "publication-links");
      for (const [label, rawUrl] of Object.entries(paper.links || {})) {
        const url = safeUrl(rawUrl);
        if (url) links.append(makeLink(label, url));
      }
      content.append(links);
      article.append(content);
      return article;
    }));
  }
  if (Array.isArray(profile.news)) {
    byId("news-list").replaceChildren(...profile.news.map(entry => {
      const row = element("div", "news-row");
      const text = element("p");
      const url = safeUrl(entry.link);
      text.append(url ? makeLink(entry.text, url) : document.createTextNode(entry.text));
      row.append(element("span", "news-date", entry.date), text);
      return row;
    }));
  }
  if (Array.isArray(profile.awards) && profile.awards.length) {
    byId("award-list").replaceChildren(...profile.awards.map(entry => {
      const row = element("div", "detail-row");
      row.append(element("time", "", entry.year), element("span", "", entry.title));
      return row;
    }));
  }
  if (Array.isArray(profile.service) && profile.service.length) {
    byId("service-list").replaceChildren(...profile.service.map(entry => element("div", "service-item", `${entry.role}: ${entry.organization}`)));
  }
  byId("current-year").textContent = String(new Date().getFullYear());
  const nav = byId("main-nav");
  const toggle = document.querySelector(".menu-toggle");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
  };
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", event => { if (event.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".header-inner")) closeMenu();
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 700) closeMenu(); });
  const navLinks = [...nav.querySelectorAll("a")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach(link => {
          const current = link.hash === `#${entry.target.id}`;
          link.classList.toggle("active", current);
          if (current) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach(section => observer.observe(section));
  }
})();

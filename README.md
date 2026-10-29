# Shujian Gao (Daryl)'s personal homepage

A lightweight academic homepage, published at **https://daryl-gsj.github.io/**.
Plain HTML, CSS, and JavaScript. No build step, dependencies, tracking, or backend.

## Update content

Edit [`assets/js/profile.js`](assets/js/profile.js). It contains the welcome message, biography,
research interests, contact links, publications, news, awards, and service.
Unknown items are intentionally left empty. Empty sections show a small placeholder;
missing contact links are inactive rather than pointing to a fake address.

### Add a portrait and CV

1. Replace the portrait at `assets/images/profile.jpg` (already set) and add a CV to `assets/files/CV.pdf`.
2. Set `portrait: "assets/images/profile.jpg"` and `cv: "assets/files/CV.pdf"`.
3. Set `email` and `scholar` to your actual email and Scholar URL.

### Add a publication

```js
publications: [
  {
    title: "Your paper title",
    authors: ["Your full name", "Coauthor"],
    highlightAuthor: "Your full name",
    venue: "Preprint", // Use only a verified status or accepted venue.
    image: "assets/images/paper.jpg", // Optional.
    links: {
      Paper: "https://example.com/paper",
      Project: "https://example.com/project",
      Code: "https://github.com/Daryl-GSJ/your-project"
    }
  }
]
```

News, award, and service entry structures are documented in `profile.js`.
Replace all example URLs before adding entries. Nothing in the example is displayed
on the live site by default.

## Preview

Open `index.html` in your browser, or run:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Deployment

GitHub Settings → Pages → Deploy from a branch → `main` → `/ (root)`.
Updates committed to `main` publish automatically. `.nojekyll` keeps the site as
plain static files. A GitHub Actions workflow is not required.

## Styling

`assets/css/style.css` controls the color palette, typography, layout,
mobile navigation, reduced motion, and print layout.

Design and code are original; the section organization follows a conventional
academic homepage. No source code or publication content from the reference site
was copied.

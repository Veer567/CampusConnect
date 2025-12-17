const fs = require("fs");
const path = require("path");

const ALLOWED_FOLDERS = [
  "app",
  "components",
  "constants",
  "hooks",
  "convex",
  "providers",
];

function tree(dir, prefix = "") {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  files.forEach((file, index) => {
    const isLast = index === files.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const fullPath = path.join(dir, file.name);

    console.log(prefix + connector + file.name);

    if (file.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      tree(fullPath, newPrefix);
    }
  });
}

ALLOWED_FOLDERS.forEach((folder, index) => {
  if (fs.existsSync(folder)) {
    const isLast = index === ALLOWED_FOLDERS.length - 1;
    const connector = isLast ? "└── " : "├── ";
    console.log(connector + folder);
    tree(folder, isLast ? "    " : "│   ");
  }
});

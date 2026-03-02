# BMR Calculator — Framer Import Instructions

---

## Prerequisites

- An active [Framer](https://framer.com) account
- The `BMRCalculator.jsx` file
- Minimum canvas frame width of **680px** recommended

---

## Step 1 — Open Your Framer Project

1. Go to [framer.com](https://framer.com) and log in
2. Open an existing project or create a new one

---

## Step 2 — Create a New Code Component

1. In the **left panel**, click the **Assets** tab (grid icon `⊞`)
2. Click the **`+`** button next to **Code**
3. Select **New Component**
4. Name it exactly: `BMRCalculator`
5. Click **Create**

Framer will open a built-in code editor with a default template.

---

## Step 3 — Paste the Component Code

1. Inside the code editor, **select all** existing code (`Cmd + A` on Mac / `Ctrl + A` on Windows)
2. **Delete** it
3. Open your `BMRCalculator.jsx` file in any text editor
4. **Copy all** the contents (`Cmd + A` → `Cmd + C`)
5. **Paste** it into the Framer code editor (`Cmd + V`)
6. Press **Save** (`Cmd + S` on Mac / `Ctrl + S` on Windows)

---

## Step 4 — Add the Component to Your Canvas

1. Close or minimize the code editor
2. In the **Assets** panel, scroll to the **Code** section
3. Find **BMRCalculator** in the list
4. **Drag and drop** it onto your canvas

---

## Step 5 — Resize the Frame

1. Select the component on the canvas
2. In the **right panel**, set the width to at least **680px**
3. Set height to **Auto** so it expands with content

---

## Step 6 — Preview

1. Click the **Play button (▶)** in the top-right corner of Framer
2. The calculator will be fully interactive in preview mode

---

## Important Notes

| Topic | Detail |
|---|---|
| **Dependencies** | None — no `npm install` required |
| **Fonts** | `Plus Jakarta Sans` loads automatically via Google Fonts |
| **React version** | Compatible with Framer's built-in React (hooks supported) |
| **Min width** | 680px recommended for best layout |
| **Framer publish** | Works on both Framer Sites and embedded frames |

---

## Troubleshooting

**Component shows a blank white box**
→ Click the component, go to the right panel, and make sure Height is set to **Auto**

**"React hooks" warning on first load**
→ Save the file (`Cmd + S`) and click **Refresh** in the Framer editor — this resolves on first reload

**Font not loading in preview**
→ Check your internet connection; the font is fetched live from Google Fonts

**Numbers not calculating**
→ Ensure all required fields are filled: Age, Weight, Height, and Gender before clicking Calculate

---

## Support

For issues with the component code, review `BMRCalculator.jsx` directly.  
For Framer-specific help, visit [framer.com/support](https://framer.com/support).

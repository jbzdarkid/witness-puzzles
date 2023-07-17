As of 7/2/2023, this codebase no longer requires a backend host.
- Routing and hosting is handled by GitHub Pages
- All of the puzzles and puzzle images are now hosted within this repo
- All of the POST actions now use Google Forms
- The puzzle publishing process uses GitHub Actions, and then updates the repo with the published puzzle

# Setting up google forms
If you fork this repo, you'll need to create your own Google Forms, so that you can run your own GitHub Action.
I have checked in the Google Apps script into the repo -- although you'll need to fill in your own GitHub personal access token.

To set up the Google Form:
1. Go to https://docs.google.com/forms/u/0/create and create a form with two "Short answer" questions
2. Click on the triple-dot in the top right, and click "Get prefilled link"
3. Fill in some placeholder data, click "Get link", and copy the result
4. Replace the code in window.publishPuzzle (editor.js) with the URL + your query parameters
5. (Google apps script)

Repeat steps 1-4 for the error reporting + user feedback URLs (both in engine/utilities.js)

OBTF-2 is a minimalist app for creating a personal work history.

It's comprised of:

- **~/Documents/OBTF**     Plain text files to store your notes
- **/plugins**   Editor tools *[currently at src/plugins]*
- **/src**       VueJS text editor
- **/src-tauri** Backend and app generator to access the filesystem


Quick Start
```
npm run tauri dev
```
This will start the development server and launch the app

# Philosophy
Creating a personal work history is one of the highest impact habits I've developed, as it allows a place for reflection and improvement. What was my rationale for a decision, unbiased by how I feel about it now? Are my actions in alignment with my priorities? How do I actually spend my time? When I had this problem 3 years ago, what was that snippet of code that fixed it?

Notes are private by nature and because we interact with them continually, even the smallest friction creates drag.

In many notes apps, the act of taking notes can become a task itself, diverting energy from the actual task. This should be avoided.

# What OBTF is not
OBTF is defined by what it doesn't do:
- Store data in a proprietary format
- Style text
- Support hierarchical notes, tagging and categorization
- Sync your notes across devices
- Expand URL's into previews
- Provide a calendar view
- Support embedding of media

By not supporting these features, we discourage the trap of notes becoming the task.


# What OBTF is
OBTF stands for One Big Text File, and aims to do a few things well:
- Provide a dedicated, long-lived space for notes
- Eliminate decision making when taking notes
- Add a dated divider to create sections
- Create an event log with timestamps
- Search across large periods of time and context
- Store notes in a format that will be readable in 100 years
- Provide a simple plugin system to enhance the editor
- Present screenshots in a timeline with notes *TODO*
- Collect tasks into a list *TODO*
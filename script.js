class Note {
    constructor(id, title, text) {
        this.id = id;
        this.title = title;
        this.text = text;
    }
}

class App {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        console.log(this.notes);
        this.selectedNoteId = ""
        this.miniSidebar = true;

        this.$activeForm = document.querySelector(".active-form");
        this.$inactiveForm = document.querySelector(".inactive-form");
        this.$noteTitle = document.querySelector("#note-title");
        this.$noteText = document.querySelector("#note-text");
        this.$notes = document.querySelector(".notes");
        this.$form = document.querySelector("#form");
        this.$modal = document.querySelector(".modal");
        this.$modalForm = document.querySelector("#modal-form");
        this.$modalTitle = document.querySelector("#modal-title");
        this.$modalText = document.querySelector("#modal-text");
        this.$closeModalForm = document.querySelector("#modal-btn");
        this.$sidebar = document.querySelector(".sidebar");
        this.$sidebarActiveItem = document.querySelector(".active-item");


        this.addEventListeners();
        this.displayNotes();
        this.syncNotesWithServer();
    }

    addEventListeners() {
        document.body.addEventListener("click", (event) => {
            this.handleFormClick(event)
            this.closeModal(event)
            this.openModal(event)
            this.handleArchiving(event)
        })

        this.$form.addEventListener("submit", (event) => {
            event.preventDefault();
            const title = this.$noteTitle.value;
            const text = this.$noteText.value;
            this.addNote({ title, text });
            this.closeActiveForm();
        })

        this.$modalForm.addEventListener("submit", (event) => {
            event.preventDefault();
        })

        this.$sidebar.addEventListener("mouseover", (event) => {
            this.handleToggleSidebar();
        })
        this.$sidebar.addEventListener("mouseout", (event) => {
            this.handleToggleSidebar();
        })
        
    }

    handleFormClick(event) {
        const isActiveFormClickedOn = this.$activeForm.contains(event.target);
        const isInactiveFormClickedOn = this.$inactiveForm.contains(event.target);
        const title = this.$noteTitle.value;
        const text = this.$noteText.value;

        if (isInactiveFormClickedOn) {
            this.openActiveForm();
        }
        else if (!isInactiveFormClickedOn && !isActiveFormClickedOn) {
            this.addNote({ title, text });
            this.closeActiveForm();
        }    
    }

    openActiveForm() {
        this.$inactiveForm.style.display = "none";
        this.$activeForm.style.display = "block";
        this.$noteText.focus();
    }
    closeActiveForm() {
        this.$inactiveForm.style.display = "block";
        this.$activeForm.style.display = "none";
        this.$noteText.value = "";
        this.$noteTitle.value = "";
    }

    openModal(event) {
        const $selectedNote = event.target.closest(".note");
        if($selectedNote && !event.target.closest(".archive")) {
            this.selectedNoteId = $selectedNote.id;
            this.$modalTitle.value = $selectedNote.children[1].innerHTML;
            this.$modalText.value = $selectedNote.children[2].innerHTML
            this.$modal.classList.add("open-modal");
        } else {
            return;
        }
    }
    closeModal(event) {
        const isModalFormClickedOn = this.$modalForm.contains(event.target);
        const isCloseModalBtnClickedOn = this.$closeModalForm.contains(event.target);
        if((!isModalFormClickedOn || isCloseModalBtnClickedOn) && this.$modal.classList.contains("open-modal")) {
            this.editNote(this.selectedNoteId, { title: this.$modalTitle.value, text: this.$modalText.value })
            this.$modal.classList.remove("open-modal");
        }
    }

    handleArchiving(event) {
        const $selectedNote = event.target.closest(".note");
        if($selectedNote && event.target.closest(".archive")) {
            this.selectedNoteId = $selectedNote.id;
            this.deleteNote(this.selectedNoteId);
        } else {
            return;
        }
    }

    addNote({ title, text }) {
        if (text.trim() !== "") {
            const newNote = new Note(cuid(), title, text);
            this.notes = [...this.notes, newNote];
            this.render();
            this.saveNoteToServer(newNote);
        }
    }

    
async editNote(id, { title, text }) {
    this.notes = this.notes.map(note => {
        if (note.id == id) {
            return { ...note, title, text };
        }
        return note;
    });

    // Update localStorage and the screen immediately
    this.render();

    // Update MongoDB
    try {
        const response = await fetch(
            `http://localhost:3000/api/notes/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title, text })
            }
        );

        if (!response.ok) {
            throw new Error("Failed to update note in MongoDB");
        }

        console.log("Note updated in MongoDB!");
    } catch (error) {
        console.error("MongoDB update failed:", error.message);
    }
}

    
async deleteNote(id) {
    this.notes = this.notes.filter(note => note.id != id);

    // Update localStorage and the screen immediately
    this.render();

    // Delete from MongoDB
    try {
        const response = await fetch(
            `http://localhost:3000/api/notes/${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        if (!response.ok) {
            throw new Error("Failed to delete note from MongoDB");
        }

        console.log("Note deleted from MongoDB!");
    } catch (error) {
        console.error("MongoDB delete failed:", error.message);
    }
}


    
handleMouseOverNote(element) {
    const $checkNote = element.querySelector(".check-circle");
    const $noteFooter = element.querySelector(".note-footer");

    $checkNote.style.visibility = "visible";
    $noteFooter.style.visibility = "visible";
}

    
handleMouseOutNote(element) {
    const $checkNote = element.querySelector(".check-circle");
    const $noteFooter = element.querySelector(".note-footer");

    $checkNote.style.visibility = "hidden";
    $noteFooter.style.visibility = "hidden";
}


    handleToggleSidebar() {
        if(this.miniSidebar) {
            this.$sidebar.style.width = "250px";
            this.$sidebar.classList.add("sidebar-hover");
            this.$sidebarActiveItem.classList.add("sidebar-active-item");
            this.miniSidebar = false;
        }
        else {
            this.$sidebar.style.width = "80px";
            this.$sidebar.classList.remove("sidebar-hover");
            this.$sidebarActiveItem.classList.remove("sidebar-active-item");
            this.miniSidebar = true;
        }
    }
    
    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));

    }

    async saveNoteToServer(note) {
    try {
        const response = await fetch(
            "http://localhost:3000/api/notes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(note)
            }
        );

        if (!response.ok) {
            throw new Error("Failed to save note to MongoDB");
        }

        console.log("Note saved to MongoDB!");
    } catch (error) {
        console.error("MongoDB save failed:", error.message);
        console.log("Your note is still saved in localStorage.");
    }
}

    async syncNotesWithServer() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/notes"
        );

        if (!response.ok) {
            throw new Error("Failed to load notes from MongoDB");
        }

        const serverNotes = await response.json();

        // Convert database notes into your app's note format
        const notesFromServer = serverNotes.map(note => ({
            id: note.id || note._id,
            title: note.title || "",
            text: note.text || note.content || ""
        }));

        // Keep local notes that are not already on the server
        const serverIds = new Set(
            notesFromServer.map(note => String(note.id))
        );

        const localOnlyNotes = this.notes.filter(
            note => !serverIds.has(String(note.id))
        );

        this.notes = [...notesFromServer, ...localOnlyNotes];

        this.render();

        console.log("Notes loaded from MongoDB!");
    } catch (error) {
        console.error("Could not load MongoDB notes:", error.message);
        console.log("Your browser-saved notes are still available.");
    }
}

    render() {
        this.saveNotes();
        this.displayNotes();
    }
    displayNotes() {
        this.$notes.innerHTML = this.notes.map((note) =>
            `
        <div class="note" id="${note.id}" onmouseover="app.handleMouseOverNote(this)" onmouseout="app.handleMouseOutNote(this)">
            <span class="material-icons check-circle">check_circle</span>
            <div class="title">${note.title}</div>
            <div class="text">${note.text}</div>
            <div class="note-footer">
                <div class="tooltip">
                    <span class="material-icons-outlined hover small-icon">add_alert</span>
                    <span class="tooltip-text">Remind me</span>
                </div>
                <div class="tooltip">
                    <span class="material-icons-outlined hover small-icon">person_add</span>
                    <span class="tooltip-text">Collaborator</span>
                </div>
                <div class="tooltip">
                    <span class="material-icons-outlined hover small-icon">palette</span>
                    <span class="tooltip-text">Change Color</span>
                </div>
                <div class="tooltip">
                    <span class="material-icons-outlined hover small-icon">image</span>
                    <span class="tooltip-text">Add Image</span>
                </div>
                <div class="tooltip archive">
                    <span class="material-icons-outlined hover small-icon">archive</span>
                    <span class="tooltip-text">Archive</span>
                </div>
                <div class="tooltip">
                    <span class="material-icons-outlined hover small-icon">more_vert</span>
                    <span class="tooltip-text">More</span>
                </div>
            </div>
        </div>
        `
        ).join("");
    }
}

const app = new App();
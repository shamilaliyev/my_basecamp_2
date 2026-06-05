# MyBasecamp2
***

## Task
MyBasecamp2 is a follow-up to the MyBasecamp1 project. It keeps the original user, session, admin, and project management features, then adds project attachments, project discussion threads, and messages inside threads.

## Description
This project is built with **Node.js**, **Express**, **EJS**, **Sequelize**, and **SQLite**. It follows the same MVC structure as MyBasecamp1, but the application now supports collaboration inside each project.

Main resources:
- **User** - registration, sign in, sign out, profile, admin role management
- **Project** - create, show, edit, and delete projects
- **ProjectMember** - associates regular users with a project
- **Attachment** - stores uploaded project files and file format
- **DiscussionThread** - project discussion area created by the project admin
- **Message** - messages posted inside a thread by associated project users

## MyBasecamp2 Features

### Project attachments
Inside a project, associated users can upload multiple attachments.

Supported formats:
- png
- jpg / jpeg
- pdf
- txt

For every uploaded file, the app stores:
- original file name
- saved file name
- format
- mime type
- file size
- uploader
- related project

Attachments are displayed on the project show page. The uploader or project admin can delete an attachment.

### Project threads
Inside a project, the project admin can create discussion threads.

Implemented actions:
- `Thread#new`
- `Thread#create`
- `Thread#edit`
- `Thread#destroy`
- `Thread#show`

Only the project admin can create, edit, or delete threads.

### Messages inside threads
Inside a thread, associated project users can post messages.

Implemented actions:
- `Message#create`
- `Message#edit`
- `Message#destroy`

Any user associated with the project can create a message. The message author or project admin can edit/delete the message.

### Project members
Because the requirement says that “users associated to the project” can create attachments and messages, MyBasecamp2 adds project membership. The project owner/admin can add or remove users from the project show page.

## Permission Rules
- First registered user becomes site admin automatically.
- Project owner is treated as the project admin.
- Site admins can manage all projects.
- Project admin can add/remove project members.
- Project admin can create/edit/delete threads.
- Associated users can upload attachments.
- Associated users can post messages inside threads.
- Users can edit/delete their own messages and attachments.

## Installation
```bash
cd my_basecamp_2
npm install
```

Make sure you have **Node.js v18+** installed.

## Usage
```bash
npm start
```

Then open:
```bash
http://localhost:3000
```

On first use:
- Register the first account.
- The first account automatically becomes admin.
- Create a project.
- Add users as associated project members.
- Upload attachments from the project page.
- Create a thread as project admin.
- Post messages inside the thread as associated users.

## Cloud Deployment
The project can be deployed to Render.

Recommended Render settings:
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Root Directory:** project root folder

Live URL:
```text
Add your Render link here after deployment.
```

## Notes
SQLite is used as a simple file-based database for the assignment. Uploaded files are stored in:

```text
public/uploads/attachments
```

For a real production system, uploaded files should be stored in a cloud file storage service, but local upload storage is enough for this assignment version.

### The Core Team
Sebine Isayeva, Lale Nasibova

<span><i>Made at <a href='https://qwasar.io'>Qwasar SV -- Software Engineering School</a></i></span>
<span><img alt='Qwasar SV -- Software Engineering School Logo' src='https://storage.googleapis.com/qwasar-public/qwasar-logo_50x50.png' width='20px' /></span>

# My Basecamp 2

A simple project collaboration website built with Python, Flask, SQLite, and Bootstrap.

## Features

- Project dashboard
- Project members
- Project admin role
- Multiple attachments inside a project
- Attachment upload
- Attachment delete
- Attachment format storage
- Project threads
- Thread create, edit, and delete
- Messages inside threads
- Message create, edit, and delete
- Permission checks for members and project admins

## Rules

Any user associated with a project can:

- upload an attachment
- delete an attachment
- create a message inside a thread
- edit or delete their own message

Only a project admin can:

- create a thread
- edit a thread
- delete a thread

## Run locally

Create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Run the app:

```bash
python app.py
```

Open:

```bash
http://127.0.0.1:5000
```

## Deployment

After deployment, add your hosted website link here:

```text
https://your-my-basecamp-2-url-here
```

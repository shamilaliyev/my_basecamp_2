from flask import Flask, render_template, request, redirect, url_for, flash, session, send_from_directory, abort
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from pathlib import Path
from datetime import datetime
import os

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "my-basecamp-2-local-key")

db_url = os.getenv("DATABASE_URL", "sqlite:///basecamp.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = "uploads"

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False)


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ProjectMembership(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    user = db.relationship("User")
    project = db.relationship("Project", backref="memberships")


class Attachment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_format = db.Column(db.String(80), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship("Project", backref="attachments")
    user = db.relationship("User")


class DiscussionThread(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship("Project", backref="threads")
    created_by = db.relationship("User")


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey("discussion_thread.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    thread = db.relationship("DiscussionThread", backref="messages")
    user = db.relationship("User")


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        user = User.query.first()
        if user:
            session["user_id"] = user.id
            return user
        return None
    return User.query.get(user_id)


def is_member(project_id, user_id):
    return ProjectMembership.query.filter_by(project_id=project_id, user_id=user_id).first() is not None


def is_project_admin(project_id, user_id):
    membership = ProjectMembership.query.filter_by(project_id=project_id, user_id=user_id).first()
    return bool(membership and membership.is_admin)


def require_member(project_id):
    user = current_user()
    if not user or not is_member(project_id, user.id):
        abort(403)
    return user


def require_project_admin(project_id):
    user = current_user()
    if not user or not is_project_admin(project_id, user.id):
        abort(403)
    return user


def file_format(filename):
    extension = Path(filename).suffix.lower().replace(".", "")
    return extension if extension else "unknown"


def seed_data():
    if User.query.count() > 0:
        return

    lala = User(username="lala", full_name="Lale Nasibova")
    leia = User(username="leia", full_name="Leia Organa")
    han = User(username="han", full_name="Han Solo")

    project_one = Project(
        title="Coruscant City Platform",
        description="A project space for planning city services, documents, and team discussions."
    )

    project_two = Project(
        title="Medical Dashboard",
        description="A project space for health reports, team messages, and shared files."
    )

    db.session.add_all([lala, leia, han, project_one, project_two])
    db.session.commit()

    db.session.add_all([
        ProjectMembership(user_id=lala.id, project_id=project_one.id, is_admin=True),
        ProjectMembership(user_id=leia.id, project_id=project_one.id, is_admin=False),
        ProjectMembership(user_id=han.id, project_id=project_one.id, is_admin=False),
        ProjectMembership(user_id=lala.id, project_id=project_two.id, is_admin=True),
        ProjectMembership(user_id=leia.id, project_id=project_two.id, is_admin=False),
    ])

    db.session.commit()


@app.before_request
def prepare_database():
    db.create_all()
    seed_data()


@app.route("/")
def home():
    user = current_user()
    users = User.query.all()
    projects = Project.query.order_by(Project.created_at.desc()).all()

    return render_template("index.html", user=user, users=users, projects=projects)


@app.route("/switch-user", methods=["POST"])
def switch_user():
    user_id = request.form.get("user_id")
    user = User.query.get_or_404(user_id)
    session["user_id"] = user.id
    flash(f"active user changed to {user.full_name}", "success")
    return redirect(request.referrer or url_for("home"))


@app.route("/projects/<int:project_id>")
def project_show(project_id):
    user = current_user()
    project = Project.query.get_or_404(project_id)
    member = is_member(project.id, user.id) if user else False
    admin = is_project_admin(project.id, user.id) if user else False

    return render_template(
        "project_show.html",
        user=user,
        project=project,
        member=member,
        admin=admin,
    )


@app.route("/projects/<int:project_id>/attachments", methods=["POST"])
def attachment_create(project_id):
    user = require_member(project_id)
    project = Project.query.get_or_404(project_id)
    uploaded_file = request.files.get("attachment")

    if not uploaded_file or uploaded_file.filename == "":
        flash("please choose a file", "warning")
        return redirect(url_for("project_show", project_id=project.id))

    original_name = secure_filename(uploaded_file.filename)
    stored_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}_{original_name}"
    upload_path = Path(app.config["UPLOAD_FOLDER"])
    upload_path.mkdir(exist_ok=True)

    uploaded_file.save(upload_path / stored_name)

    attachment = Attachment(
        project_id=project.id,
        user_id=user.id,
        filename=original_name,
        stored_filename=stored_name,
        file_format=file_format(original_name),
    )

    db.session.add(attachment)
    db.session.commit()

    flash("attachment added", "success")
    return redirect(url_for("project_show", project_id=project.id))


@app.route("/attachments/<int:attachment_id>/download")
def attachment_download(attachment_id):
    attachment = Attachment.query.get_or_404(attachment_id)
    require_member(attachment.project_id)

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        attachment.stored_filename,
        as_attachment=True,
        download_name=attachment.filename,
    )


@app.route("/attachments/<int:attachment_id>/delete", methods=["POST"])
def attachment_destroy(attachment_id):
    attachment = Attachment.query.get_or_404(attachment_id)
    require_member(attachment.project_id)

    file_path = Path(app.config["UPLOAD_FOLDER"]) / attachment.stored_filename
    if file_path.exists():
        file_path.unlink()

    project_id = attachment.project_id
    db.session.delete(attachment)
    db.session.commit()

    flash("attachment removed", "success")
    return redirect(url_for("project_show", project_id=project_id))


@app.route("/projects/<int:project_id>/threads/new")
def thread_new(project_id):
    user = require_project_admin(project_id)
    project = Project.query.get_or_404(project_id)

    return render_template("thread_form.html", user=user, project=project, thread=None)


@app.route("/projects/<int:project_id>/threads", methods=["POST"])
def thread_create(project_id):
    user = require_project_admin(project_id)
    project = Project.query.get_or_404(project_id)

    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()

    if not title or not description:
        flash("title and description are required", "warning")
        return redirect(url_for("thread_new", project_id=project.id))

    thread = DiscussionThread(
        project_id=project.id,
        created_by_id=user.id,
        title=title,
        description=description,
    )

    db.session.add(thread)
    db.session.commit()

    flash("thread created", "success")
    return redirect(url_for("project_show", project_id=project.id))


@app.route("/threads/<int:thread_id>")
def thread_show(thread_id):
    user = current_user()
    thread = DiscussionThread.query.get_or_404(thread_id)
    require_member(thread.project_id)
    admin = is_project_admin(thread.project_id, user.id)

    return render_template("thread_show.html", user=user, thread=thread, admin=admin)


@app.route("/threads/<int:thread_id>/edit")
def thread_edit(thread_id):
    thread = DiscussionThread.query.get_or_404(thread_id)
    user = require_project_admin(thread.project_id)

    return render_template("thread_form.html", user=user, project=thread.project, thread=thread)


@app.route("/threads/<int:thread_id>/update", methods=["POST"])
def thread_update(thread_id):
    thread = DiscussionThread.query.get_or_404(thread_id)
    require_project_admin(thread.project_id)

    thread.title = request.form.get("title", "").strip()
    thread.description = request.form.get("description", "").strip()

    if not thread.title or not thread.description:
        flash("title and description are required", "warning")
        return redirect(url_for("thread_edit", thread_id=thread.id))

    db.session.commit()

    flash("thread updated", "success")
    return redirect(url_for("thread_show", thread_id=thread.id))


@app.route("/threads/<int:thread_id>/delete", methods=["POST"])
def thread_destroy(thread_id):
    thread = DiscussionThread.query.get_or_404(thread_id)
    project_id = thread.project_id
    require_project_admin(project_id)

    for message in list(thread.messages):
        db.session.delete(message)

    db.session.delete(thread)
    db.session.commit()

    flash("thread removed", "success")
    return redirect(url_for("project_show", project_id=project_id))


@app.route("/threads/<int:thread_id>/messages", methods=["POST"])
def message_create(thread_id):
    thread = DiscussionThread.query.get_or_404(thread_id)
    user = require_member(thread.project_id)

    body = request.form.get("body", "").strip()

    if not body:
        flash("message cannot be empty", "warning")
        return redirect(url_for("thread_show", thread_id=thread.id))

    message = Message(thread_id=thread.id, user_id=user.id, body=body)

    db.session.add(message)
    db.session.commit()

    flash("message posted", "success")
    return redirect(url_for("thread_show", thread_id=thread.id))


@app.route("/messages/<int:message_id>/edit")
def message_edit(message_id):
    message = Message.query.get_or_404(message_id)
    user = require_member(message.thread.project_id)

    if message.user_id != user.id and not is_project_admin(message.thread.project_id, user.id):
        abort(403)

    return render_template("message_edit.html", user=user, message=message)


@app.route("/messages/<int:message_id>/update", methods=["POST"])
def message_update(message_id):
    message = Message.query.get_or_404(message_id)
    user = require_member(message.thread.project_id)

    if message.user_id != user.id and not is_project_admin(message.thread.project_id, user.id):
        abort(403)

    body = request.form.get("body", "").strip()

    if not body:
        flash("message cannot be empty", "warning")
        return redirect(url_for("message_edit", message_id=message.id))

    message.body = body
    db.session.commit()

    flash("message updated", "success")
    return redirect(url_for("thread_show", thread_id=message.thread_id))


@app.route("/messages/<int:message_id>/delete", methods=["POST"])
def message_destroy(message_id):
    message = Message.query.get_or_404(message_id)
    user = require_member(message.thread.project_id)

    if message.user_id != user.id and not is_project_admin(message.thread.project_id, user.id):
        abort(403)

    thread_id = message.thread_id

    db.session.delete(message)
    db.session.commit()

    flash("message removed", "success")
    return redirect(url_for("thread_show", thread_id=thread_id))


if __name__ == "__main__":
    app.run(debug=True)

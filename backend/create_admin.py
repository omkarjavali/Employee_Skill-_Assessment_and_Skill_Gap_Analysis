import app.models

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

from datetime import datetime


# =========================================================
# ADMIN CONFIGURATION
# =========================================================

ADMIN_NAME = "System Admin"
ADMIN_EMAIL = "admin@skilllens.com"
ADMIN_PASSWORD = "Admin@123456"


# =========================================================
# CREATE ADMIN
# =========================================================

def create_admin():

    db = SessionLocal()

    try:

        # -------------------------------------------------
        # Normalize email
        # -------------------------------------------------

        email = ADMIN_EMAIL.strip().lower()


        # -------------------------------------------------
        # Validate password
        # -------------------------------------------------

        if len(
            ADMIN_PASSWORD.encode("utf-8")
        ) > 72:

            raise ValueError(
                "Password must not exceed 72 bytes"
            )


        if len(ADMIN_PASSWORD) < 8:

            raise ValueError(
                "Password must be at least 8 characters"
            )


        # -------------------------------------------------
        # Check existing user
        # -------------------------------------------------

        existing_user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )


        if existing_user:

            print(
                "⚠️ A user with this email already exists."
            )

            print(
                "ID:",
                existing_user.id
            )

            print(
                "Role:",
                existing_user.role
            )

            return


        # -------------------------------------------------
        # Create admin
        # -------------------------------------------------

        admin = User(

            name=ADMIN_NAME,

            email=email,

            password_hash=hash_password(
                ADMIN_PASSWORD
            ),

            role="ADMIN",

            # Admin does not need a business role
            role_id=None,

            created_at=datetime.utcnow()
        )


        db.add(admin)

        db.commit()

        db.refresh(admin)


        print(
            "\n✅ ADMIN CREATED SUCCESSFULLY"
        )

        print(
            "--------------------------------"
        )

        print(
            "ID:",
            admin.id
        )

        print(
            "Name:",
            admin.name
        )

        print(
            "Email:",
            admin.email
        )

        print(
            "Role:",
            admin.role
        )

        print(
            "--------------------------------"
        )

        print(
            "You can now login using:"
        )

        print(
            admin.email
        )


    except Exception as exc:

        db.rollback()

        print(
            "❌ Failed to create admin:"
        )

        print(exc)


    finally:

        db.close()


if __name__ == "__main__":

    create_admin()
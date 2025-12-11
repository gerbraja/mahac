from backend.database.connection import Base, engine


def import_models():
    """Import all modules inside backend.database.models so SQLAlchemy
    declarative models are registered on Base.metadata before create_all.
    """
    import pkgutil
    import importlib
    import backend.database.models as models_pkg

    pkg_path = models_pkg.__path__
    for finder, name, ispkg in pkgutil.iter_modules(pkg_path):
        full_name = f"{models_pkg.__name__}.{name}"
        try:
            importlib.import_module(full_name)
        except Exception as e:
            print(f"Warning: failed to import {full_name}: {e}")


def main():
    print("Engine:", engine)
    print("Importing models package to register models on Base.metadata...")
    import_models()
    print("Creating all tables from SQLAlchemy metadata (if they do not exist)...")
    Base.metadata.create_all(bind=engine)
    print("Done: metadata.create_all()")


if __name__ == '__main__':
    main()

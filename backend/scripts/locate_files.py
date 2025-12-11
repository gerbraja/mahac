import os

def find_files(filename):
    print(f"Searching for {filename}...")
    for root, dirs, files in os.walk("."):
        if filename in files:
            print(os.path.abspath(os.path.join(root, filename)))

if __name__ == "__main__":
    find_files("dev.db")
    find_files(".env")

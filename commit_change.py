# helper script for commiting changes to userscripts, taking care of parts of the commit message and updating version of script
import inquirer
import subprocess
import sys
from packaging import version
import re
import os
from collections import defaultdict


def cmd_out(cmd: str):
    return subprocess.getoutput(cmd)


def run_and_print_result(cmd: str):
    print(cmd)
    print(cmd_out(cmd))
    print()


def error(msg: str):
    sys.exit(f"ERROR: {msg}")


def main():
    status_dict = defaultdict(list)

    def add_file_to_status_dict(git_file_status_line):
        # first char: staged changes, second char: unstaged changes
        # possible status values: A (added), M (modified), D (deleted), ? (untracked)
        # actually, in total untracked is always '??' and A can only be 'A '
        status = git_file_status_line[0:2]
        name = git_file_status_line[3:]
        if status[0] == "D ":
            error(
                "You have staged the deletion of a file. Please handle + commit it manually."
            )
        if name.endswith(".js"):
            status_dict[status].append(name)
        else:
            # need to handle commit_change.py separately, otherwise I would not be able to test changes to the script properly
            if name == "commit_change.py" and status[0] != " ":
                error(
                    "Please commit changes to 'commit_change.py' separately. This script only handles userscript (.js) files"
                )
            elif name != "commit_change.py":
                error(
                    f"'{name}' is not a JS file, please handle it separately. This script only handles userscript (.js) files"
                )

    for line in cmd_out("git status -s").split("\n"):
        add_file_to_status_dict(line)

    staged_changes = []

    for status, files in status_dict.items():
        if status[0] != " " and status != "??":
            for file in files:
                staged_changes.append[file]

    if len(staged_changes) > 1:
        error(
            "Multiple userscript file changes are already staged. Please unstage all except one with 'git restore --staged filepath' and try again."
        )
    elif len(staged_changes) == 1:
        pass

    files_to_pick = []
    filepicker_opts = []

    def get_status_desc(status):
        if status == "??":
            return "new"
        if status == " M":
            return "modified"
        return ""  # shouldn't be reachable, not entirely sure

    def add_filepicker_option(file, status):
        files_to_pick.append(file)
        filepicker_opts.append(f"{file} ({get_status_desc(status)})")

    for status, files in status_dict.items():
        if status[0] == " " or status[0] == "?":
            for f in files:
                add_filepicker_option(f, status)
        else:
            error("Whoah, this line should be unreachable")

    if len(filepicker_opts) == 0:
        error("No userscript files changed, nothing to commit!")

    if len(filepicker_opts) > 1:
        selected_file = inquirer.list_input(
            "What userscript change would you like to commit?",
            choices=list(zip(filepicker_opts, files_to_pick)),
        )
    else:
        selected_file = files_to_pick[0]

    file_version_str = ""
    with open(selected_file, "r") as f:
        lines = f.readlines()
        for line in lines:
            match = re.search(r"\s?//\s*@version\s*(([0-9]+\.?)+|([0-9]+))", line)
            if match:
                file_version_str = match.group(1)

    if len(file_version_str) == 0:
        error(
            f"No '@version' tag found! '{selected_file}' cannot be valid userscript file!"
        )
    file_version = version.parse(file_version_str)

    is_untracked = selected_file in status_dict["??"]

    if not is_untracked:
        file_previous_commit = cmd_out(f"git show HEAD:{selected_file}")
        match = re.search(
            r"\s?//\s*@version\s*(([0-9]+\.?)+|([0-9]+))", file_previous_commit
        )
        if match:
            prev_file_version_str = match.group(1)
            prev_file_version = version.parse(prev_file_version_str)

    print(
        f"You're about to commit and push {f'a new file ({selected_file})' if is_untracked else f'changes to {selected_file}'}."
    )

    if is_untracked and file_version > version.parse("0.0.1"):
        while True:
            resp = input(
                f"Script version in @version tag is {file_version}. Stick with it? (Yes/No)? "
            )
            resp = resp.lower()
            if resp == "y" or resp == "yes":
                version_confirmed = True
                break
            if resp == "n" or resp == "no":
                version_confirmed = False
                break
    elif file_version > prev_file_version:
        while True:
            resp = input(
                f"Current @version tag ({file_version}) > previous ({prev_file_version}). Stick with this version (Yes/No)? "
            )
            resp = resp.lower()
            if resp == "y" or resp == "yes":
                version_confirmed = True
                break
            if resp == "n" or resp == "no":
                version_confirmed = False
                break
    else:
        version_confirmed = False

    while not version_confirmed:
        file_version_str = input(
            f"Choose a release version {f'(Last release version was {prev_file_version})' if not is_untracked else '(Minimum: 0.0.1)'}: "
        )

        try:
            file_version = version.parse(file_version_str)

            if type(file_version) == version.LegacyVersion:
                print("Please enter a valid version number!")
                continue
            if not is_untracked and file_version <= prev_file_version:
                print(f"Please provide a version number larger than the last one!")
                file_version
            elif is_untracked and file_version < version.parse("0.0.1"):
                print("Please provide a version number of at least 0.0.1!")
            else:
                break
        except:
            print("Please enter a valid version number!")

    # update @version tag (in-memory for now)
    with open(selected_file) as f:
        file_content = f.read()
        # https://stackoverflow.com/a/50718796/13727176
        file_content_updated_version = re.sub(
            r"(\s?//\s*@version\s*)(([0-9]+\.?)+|([0-9]+))",
            r"\g<1>" + str(file_version),
            file_content,
        )

    file_no_ext = re.sub("\.js$", "", selected_file)
    commit_msg = f"{file_no_ext} v{file_version}: {input('Commit message: ')}"

    with open(selected_file, "w") as f:
        f.write(file_content_updated_version)

    print("updated @version tag of script to", str(file_version))

    print("\nadding file changes to staging area")
    run_and_print_result(f"git add {selected_file}")

    print("\ncreating commit")
    run_and_print_result(f"git commit -m '{commit_msg}'")

    print("\npushing to remote")
    run_and_print_result("git push")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)

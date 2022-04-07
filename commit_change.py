# helper script for commiting changes to userscripts, taking care of parts of the commit message and updating version of script
import inquirer
import subprocess
import sys
from packaging import version
import re
import os


def cmd_out(cmd: str):
    return subprocess.getoutput(cmd)


def run_and_print_result(cmd: str):
    print(cmd)
    print(cmd_out(cmd))
    print()


def error(msg: str):
    sys.exit(f"ERROR: {msg}")


def main():
    modified_files = list(filter(len, cmd_out("git ls-files . -m").split("\n")))
    untracked_files = list(
        filter(len, cmd_out("git ls-files --others --exclude-standard").split("\n"),)
    )

    all_files = modified_files + untracked_files
    all_files = list(filter(lambda fname: fname.endswith(".js"), all_files))

    u_suff = " (new)"
    untracked_file_opts = [fname + u_suff for fname in untracked_files]

    all_file_opts = modified_files + untracked_file_opts

    if len(all_files) == 0:
        error("No .js files changed, nothing to commit!")

    selected_file = (
        inquirer.list_input(
            "What userscript change would you like to commit?", choices=all_file_opts,
        )
        if len(all_files) > 1
        else all_files[0]
    )

    if len(all_files) == 1:
        print(
            f"File '{selected_file}' was selected as it is the only file with changes"
        )

    is_untracked = u_suff in selected_file
    selected_file = selected_file.removesuffix(u_suff)

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

    if not is_untracked:
        file_previous_commit = cmd_out(f"git show HEAD:{selected_file}")
        match = re.search(
            r"\s?//\s*@version\s*(([0-9]+\.?)+|([0-9]+))", file_previous_commit
        )
        if match:
            prev_file_version_str = match.group(1)
            prev_file_version = version.parse(prev_file_version_str)

    if not is_untracked and file_version > prev_file_version:
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

    commit_msg = f"{selected_file.removesuffix('.js')} v + {file_version}: {input('Commit message: ')}"

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

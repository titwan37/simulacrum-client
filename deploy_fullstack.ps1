# Install sshpass if not present: wsl sudo apt update && sudo apt install sshpass -y

# 🚀 Master Deployment (Backend + Frontend)
# --ask-pass: Asks for the NAS password (titwan)
# --ask-become-pass: Asks for the Sudo password on the NAS
# --private-key: Uses the secure key for the IONOS VPS (root)

wsl ANSIBLE_CONFIG=./ansible.cfg ansible-playbook -i inventory.ini deploy_fullstack.yml --private-key=~/ionos_sec_ed25519
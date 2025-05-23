@echo off
echo Starting Git operations...

echo Creating new branch...
git checkout -b profile-section-updates

echo Adding all changes...
git add .

echo Committing changes...
git commit -m "Enhanced profile section with improved UI and functionality"

echo Pushing to remote...
git push -u origin profile-section-updates

echo Done!

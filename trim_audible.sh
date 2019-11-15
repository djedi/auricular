rm output.m4b*
rm cover.jpg*

# get cover art
ffmpeg -i "$1" -an -codec:v copy cover.jpg

# resize and square cover art to 500x500 px
# sips -Z 500 cover.jpg
# sipz -p 500 500 --padColor 333333 cover.jpg

# calculate duration to trim audible end clip
dur=$(ffprobe -i "$1" -show_entries format=duration -v quiet -of csv="p=0")
echo $dur
dur=$(echo $dur | cut -d "." -f 1 | cut -d "," -f 1)
trim=$((dur - 6))
echo $trim

# main work to copy and trim
ffmpeg -hide_banner -i "$1" -ss 2 -t $trim -map 0:a -c copy output.m4b

# add the cover art back on
mp4art -q --add cover.jpg output.m4b

# housekeeping
rm cover.jpg
rm "$1"
mv output.m4b "$1"
#!/bin/bash
echoerr() {
    echo "$@" 1>&2;
}
port=8879
#Count running instances
count=$(ps -ea | grep python | grep ${port} | grep -v grep | wc -l)
count=`expr ${count} + 0`
#If there are running instances, we need to kill them
if [ "$count" != "0" ];
then
    echoerr "Killing existing server instances on port ${port}"
    killall python
fi
#This is to enable job control
set -m
#Start a simple server and send it to the background
python -m SimpleHTTPServer 8879 &
#Open up the test suite in the default browser
url="http://localhost:${port}/test"
if command -v open > /dev/null
then
    if [ "$BROWSER" != "" ];
    then
        echoerr "Using provided browser ${BROWSER}"
        open "${BROWSER}" --args ${url}
    else
        open ${url}
    fi
elif command -v gnome-open > /dev/null
then
    if [ "$BROWSER" != "" ];
    then
        echoerr "Ignoring browser ${BROWSER}"
    fi
    gnome-open ${url}
elif command -v xdg-open > /dev/null
then
    if [ "$BROWSER" != "" ];
    then
        echoerr "Ignoring browser ${BROWSER}"
    fi
    xdg-open ${url}
fi
#Bring the server app so that it can dump out its output to the console
fg > /dev/null
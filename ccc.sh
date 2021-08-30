#!/bin/bash

if [ -z $(git check-ignore '.scannerwork') ]; then
	echo 'not found'
fi

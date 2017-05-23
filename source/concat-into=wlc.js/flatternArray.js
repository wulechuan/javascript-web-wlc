function getFlattenArrayFrom(theArray, shouldDiveDeeply) {
	if (!Array.isArray(theArray)) {
		return theArray;
	}

	return theArray.reduce((previousResult, currentElement)=> {
		if (Array.isArray(currentElement)) {
			return previousResult.concat(
                shouldDiveDeeply ?
                getFlattenArrayFrom(currentElement, true) :
                currentElement
            );
		} else {
			previousResult.push(currentElement);
			return previousResult;
		}
	}, []);
}

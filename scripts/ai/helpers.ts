function rotate(list: any[], currentElement: any) {
    const currentIndex = list.indexOf(currentElement)
    let nextIndex = currentIndex === list.length - 1 ? 0 : currentIndex + 1
    const nextElement = list[nextIndex]
    return nextElement
}

export { rotate }
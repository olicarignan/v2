export const elementsOverlap = (item, cursor) => {
  const collide = !(
    item.top > cursor.bottom ||
    item.right < cursor.left ||
    item.bottom < cursor.top ||
    item.left > cursor.right
  );

  return collide;
};

# TODO
- [x] FIX: When double-clicking the resize corner grab-point, the widget returns to it's original size and the snapping-hint remains the same size until resizing.
    - preventDefault on doubleclick event.
- [x] Mask on resize or movement. In case some widgets laggs a bit on resizing due to computation, give the option to mask the widget until it's placed again.
- [x] Better styling and styling configuration options (var's).

- [ ] Add vertical stretchability, for new and moving widgets.
    - [ ] Vertical scaling on hovering outside of bounds.

- [ ] Add "Partial shifting"; don't let widgets overlap, keep the previous position until a new (valid) one is found.

- [ ] Add some delay before snapp-hint disappears when widget snapps back.

- [ ] Add fit-snappable-width-to-widgets-width when scaling the container window. To avoid widgets from being out-of-bounds of the container.
    - [ ] Add self-adjustment on out-of-bounds after container resize.
- [ ] Horizontal pixel-chunk-shrink-&-grow.

- [ ] FIX: Snapping-limit container sometimes not centering inside parent.
    - Need to check if this is still relevant.

## QOA
- [ ] Add min / max widget size (bind with rendered child?)
- [ ] Add "undo" feature by saving the current specs before updating the config.
- [ ] Add style option; when resizing, only resize a dotted "border" before actually resizing the widget when letting go of the cursor.

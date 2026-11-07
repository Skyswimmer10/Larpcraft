# Story items and physical props

A Story Item describes the fictional object: for example, a lightsaber and its lore. Its optional **Real item / prop** connection points to a real object in the active game's **Items & Gadgets**, such as a red foam stick. Physical items can be created there or imported from the **Physical** library.

Select the Story Item, choose **Physical item in this game**, and select a prop. The inspector displays the prop's current description, practical notes, image and availability. **Edit real item** selects its inventory record for editing. **Unlink real item** removes only the connection.

The link uses the existing `itemId` field. It stores no copied description: editing either record preserves the other. The same controls apply inside nested game graphs and Master Story graphs. Missing prop references remain visible and can be replaced or removed.

Prop assignments are per game. Reusing a Story Item library template starts without an assigned physical item, so it cannot accidentally select another game's object with a matching ID. Library Story Item editors explain that assignment happens after adding the item to a game.

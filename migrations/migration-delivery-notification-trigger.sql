-- ============================================
-- DELIVERY ASSIGNMENT NOTIFICATION TRIGGER
-- ============================================
-- This trigger automatically creates order notifications
-- when delivery assignments are created or updated
-- ============================================

-- Create function to notify on delivery assignment changes
CREATE OR REPLACE FUNCTION notify_delivery_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_order_user_id UUID;
  v_driver_name TEXT;
  v_order_id UUID;
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  -- Get order user_id and order_id
  SELECT user_id, id INTO v_order_user_id, v_order_id
  FROM orders
  WHERE id = NEW.order_id;

  -- If order has no user_id, exit (guest checkout)
  IF v_order_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get driver name if driver_id exists
  IF NEW.driver_id IS NOT NULL THEN
    SELECT name INTO v_driver_name
    FROM drivers
    WHERE id = NEW.driver_id;
  END IF;

  -- Handle INSERT (new assignment)
  IF TG_OP = 'INSERT' THEN
    -- Check if status is 'assigned'
    IF NEW.status = 'assigned' THEN
      INSERT INTO order_notifications (
        user_id,
        order_id,
        type,
        message,
        read,
        created_at
      ) VALUES (
        v_order_user_id,
        v_order_id,
        'driver_assigned',
        CASE
          WHEN v_driver_name IS NOT NULL THEN
            'Driver ' || v_driver_name || ' has been assigned to your order!'
          ELSE
            'A driver has been assigned to your order!'
        END,
        false,
        NOW()
      );
    END IF;
  END IF;

  -- Handle UPDATE (status change)
  IF TG_OP = 'UPDATE' THEN
    v_old_status := OLD.status;
    v_new_status := NEW.status;

    -- Notify when status changes to 'assigned'
    IF v_old_status != 'assigned' AND v_new_status = 'assigned' THEN
      INSERT INTO order_notifications (
        user_id,
        order_id,
        type,
        message,
        read,
        created_at
      ) VALUES (
        v_order_user_id,
        v_order_id,
        'driver_assigned',
        CASE
          WHEN v_driver_name IS NOT NULL THEN
            'Driver ' || v_driver_name || ' has been assigned to your order!'
          ELSE
            'A driver has been assigned to your order!'
        END,
        false,
        NOW()
      );
    END IF;

    -- Notify when status changes to 'delivered'
    IF v_old_status != 'delivered' AND v_new_status = 'delivered' THEN
      INSERT INTO order_notifications (
        user_id,
        order_id,
        type,
        message,
        read,
        created_at
      ) VALUES (
        v_order_user_id,
        v_order_id,
        'delivered',
        'Your order has been delivered! Thank you for shopping with us.',
        false,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_delivery_assignment_changed ON delivery_assignments;

-- Create trigger
CREATE TRIGGER on_delivery_assignment_changed
  AFTER INSERT OR UPDATE ON delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION notify_delivery_assignment();

-- ============================================
-- NOTES
-- ============================================
-- This trigger:
-- 1. Checks if order has a user_id (skip for guest checkout)
-- 2. Fetches driver name if driver_id exists
-- 3. Creates 'driver_assigned' notification when assignment is created or status changes to 'assigned'
-- 4. Creates 'delivered' notification when status changes to 'delivered'
-- 5. Uses SECURITY DEFINER to allow inserting into order_notifications table
-- ============================================


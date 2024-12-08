// Get current context
let context = flow.get('context') || {};

// Update context with new values if they exist
if (msg.topic === 'battery/soc') context.batterySoc = msg.payload;
if (msg.topic === 'ac/power/L1') context.L1Power = Math.abs(msg.payload);
if (msg.topic === 'ac/power/L2') context.L2Power = Math.abs(msg.payload);
if (msg.topic === 'solar/power') context.solarPower = msg.payload;

// Store updated context
flow.set('context', context);

// Only proceed if this is a timer trigger or if we have all required values
if (!msg.topic || (context.batterySoc !== undefined && 
    context.L1Power !== undefined && 
    context.L2Power !== undefined)) {
    
    // Get current time
    let now = new Date();
    let hour = now.getHours();

    // Check if we're in solar production hours (9AM to 4PM)
    let isDaytime = (hour >= 8 && hour < 16);

    // Check if power on either leg exceeds 3000W
    let powerExceeded = (context.L1Power > 3000 || context.L2Power > 3000);

    // Check if battery is below 50% after 4PM
    let batteryLow = (context.batterySoc < 50 && hour >= 16);
   
    // Determine if we should ignore AC input
    let shouldIgnoreAC = isDaytime && !powerExceeded && !batteryLow;
    let SwitchPos = "undefined";
        if (shouldIgnoreAC){
            SwitchPos = "2";
        }else {
            SwitchPos = "3";
        }


    return {
        payload: SwitchPos,
        topic: 'vebus/0/Ac/Control/IgnoreAc',
        reason: powerExceeded ? 'Power exceeded' : 
                batteryLow ? 'Battery low after 4PM' : 
                !isDaytime ? 'Outside solar hours' : 
                'Normal solar operation',
        context: context
    };
}

return null;
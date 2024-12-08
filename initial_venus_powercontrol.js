[
    {
        "id": "865551eb89348469",
        "type": "tab",
        "label": "Solar Self Consumption",
        "disabled": false,
        "info": "",
        "env": []
    },
    {
        "id": "monitor_timer",
        "type": "inject",
        "z": "865551eb89348469",
        "name": "Check every minute",
        "props": [
            {
                "p": "payload"
            },
            {
                "p": "topic",
                "vt": "str"
            }
        ],
        "repeat": "60",
        "crontab": "",
        "once": true,
        "onceDelay": "",
        "topic": "",
        "payload": "",
        "payloadType": "str",
        "x": 140,
        "y": 140,
        "wires": [
            [
                "check_conditions"
            ]
        ]
    },
    {
        "id": "battery_soc",
        "type": "victron-input-battery",
        "z": "865551eb89348469",
        "service": "com.victronenergy.battery/279",
        "path": "/Soc",
        "serviceObj": {
            "service": "com.victronenergy.battery/279",
            "name": "SmartShunt Tigger 2"
        },
        "pathObj": {
            "path": "/Soc",
            "type": "float",
            "name": "State of charge (%)"
        },
        "name": "Battery SOC",
        "onlyChanges": false,
        "x": 140,
        "y": 200,
        "wires": [
            [
                "update_context"
            ]
        ]
    },
    {
        "id": "solar_power",
        "type": "victron-input-solarcharger",
        "z": "865551eb89348469",
        "service": "com.victronenergy.solarcharger/0",
        "path": "/Yield/Power",
        "serviceObj": {
            "service": "com.victronenergy.solarcharger/0",
            "name": "SmartSolar MPPT VE.Can 250/85 rev2"
        },
        "pathObj": {
            "path": "/Yield/Power",
            "type": "float",
            "name": "PV Power (W)"
        },
        "name": "Solar Power",
        "onlyChanges": false,
        "x": 130,
        "y": 420,
        "wires": [
            [
                "update_context"
            ]
        ]
    },
    {
        "id": "check_conditions",
        "type": "function",
        "z": "865551eb89348469",
        "name": "Check System Conditions",
        "func": "// Get current context\nlet context = flow.get('context') || {};\n\n// Update context with new values if they exist\nif (msg.topic === \"Battery SOC\") context.batterySoc = msg.payload;\nif (msg.topic === \"AC Power L1\") context.L1Power = Math.abs(msg.payload);\nif (msg.topic === \"AC Power L2\") context.L2Power = Math.abs(msg.payload);\nif (msg.topic === \"Solar Power\") context.solarPower = msg.payload;\n\n// Store updated context\nflow.set('context', context);\n\n// Only proceed if this is a timer trigger or if we have all required values\nif (!msg.topic || (context.batterySoc !== undefined && \n    context.L1Power !== undefined && \n    context.L2Power !== undefined)) {\n    \n    // Get current time\n    let now = new Date();\n    let hour = now.getHours();\n    \n    // Check if we're in solar production hours (8AM to 4PM)\n    let isDaytime = (hour >= 8 && hour < 16);\n    \n    // Check if power on either leg exceeds 3000W\n    let powerExceeded = (context.L1Power > 3000 || context.L2Power > 3000);\n    \n    // Check if battery is below 50% after 4PM\n    let batteryLow = (context.batterySoc < 50 && hour >= 16);\n    \n    // Check if battery needs daytime charging (below 50%)\n    let needsDaytimeCharge = (context.batterySoc < 50 && isDaytime);\n    \n    // Check if battery has reached daytime charging target (70%)\n    let daytimeChargeComplete = (context.batterySoc >= 70 && isDaytime);\n    \n    // Determine if we should ignore AC input\n    let shouldIgnoreAC;\n    \n    if (powerExceeded) {\n        // If power is exceeded, use AC\n        shouldIgnoreAC = false;\n    } else if (batteryLow) {\n        // If battery is low after 4PM, use AC\n        shouldIgnoreAC = false;\n    } else if (needsDaytimeCharge && !daytimeChargeComplete) {\n        // If battery needs charging during day and hasn't reached target, use AC\n        shouldIgnoreAC = false;\n    } else if (!isDaytime) {\n        // Outside solar hours, use AC\n        shouldIgnoreAC = false;\n    } else {\n        // Normal solar operation, ignore AC\n        shouldIgnoreAC = true;\n    }\n    \n    // Set switch position based on AC input decision\n    let SwitchPos;\n    if (shouldIgnoreAC) {\n        SwitchPos = \"2\";  // Ignore AC input (use solar/battery)\n    } else {\n        SwitchPos = \"3\";  // Use AC input (grid power)\n    }\n    \n    return {\n        payload: SwitchPos,\n        topic: 'vebus/0/Ac/Control/IgnoreAc',\n        reason: powerExceeded ? 'Power exceeded' : \n                batteryLow ? 'Battery low after 4PM' : \n                (needsDaytimeCharge && !daytimeChargeComplete) ? 'Daytime charging needed' :\n                daytimeChargeComplete ? 'Daytime charging complete' :\n                !isDaytime ? 'Outside solar hours' : \n                'Normal solar operation',\n        debug: {\n            time: now.toLocaleTimeString(),\n            hour: hour,\n            isDaytime: isDaytime,\n            batterySoc: context.batterySoc,\n            L1Power: context.L1Power,\n            L2Power: context.L2Power,\n            solarPower: context.solarPower,\n            powerExceeded: powerExceeded,\n            batteryLow: batteryLow,\n            needsDaytimeCharge: needsDaytimeCharge,\n            daytimeChargeComplete: daytimeChargeComplete,\n            shouldIgnoreAC: shouldIgnoreAC,\n            switchPosition: SwitchPos,\n            msgin: msg.payload\n        },\n        context: context\n    };\n}\nreturn null;",
        "outputs": 1,
        "timeout": "",
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 510,
        "y": 140,
        "wires": [
            [
                "debug",
                "control_ac"
            ]
        ]
    },
    {
        "id": "control_ac",
        "type": "victron-output-vebus",
        "z": "865551eb89348469",
        "service": "com.victronenergy.vebus/276",
        "path": "/Mode",
        "serviceObj": {
            "service": "com.victronenergy.vebus/276",
            "name": "MultiPlus-II 48/5000/70-95 120V"
        },
        "pathObj": {
            "path": "/Mode",
            "type": "enum",
            "name": "Switch Position",
            "remarks": "<p>Note that <tt>/ModeIsAdjustable</tt> needs to be set to 1.</p> ",
            "enum": {
                "1": "Charger Only",
                "2": "Inverter Only",
                "3": "On",
                "4": "Off"
            },
            "writable": true
        },
        "initial": "",
        "name": "Control AC Input",
        "onlyChanges": true,
        "x": 670,
        "y": 240,
        "wires": []
    },
    {
        "id": "debug",
        "type": "debug",
        "z": "865551eb89348469",
        "name": "Debug Output",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 660,
        "y": 320,
        "wires": []
    },
    {
        "id": "81c7f96075494bce",
        "type": "victron-input-vebus",
        "z": "865551eb89348469",
        "service": "com.victronenergy.vebus/276",
        "path": "/Ac/Out/L1/P",
        "serviceObj": {
            "service": "com.victronenergy.vebus/276",
            "name": "MultiPlus-II 48/5000/70-95 120V"
        },
        "pathObj": {
            "path": "/Ac/Out/L1/P",
            "type": "float",
            "name": "Output power phase 1 (W)"
        },
        "name": "AC Power L1",
        "onlyChanges": false,
        "x": 130,
        "y": 280,
        "wires": [
            [
                "update_context"
            ]
        ]
    },
    {
        "id": "c0ff8eb437c4ee0d",
        "type": "victron-input-vebus",
        "z": "865551eb89348469",
        "service": "com.victronenergy.vebus/276",
        "path": "/Ac/Out/L2/P",
        "serviceObj": {
            "service": "com.victronenergy.vebus/276",
            "name": "MultiPlus-II 48/5000/70-95 120V"
        },
        "pathObj": {
            "path": "/Ac/Out/L2/P",
            "type": "float",
            "name": "Output power phase 2 (W)"
        },
        "name": "AC Power L2",
        "onlyChanges": false,
        "x": 130,
        "y": 360,
        "wires": [
            [
                "update_context"
            ]
        ]
    },
    {
        "id": "update_context",
        "type": "function",
        "z": "865551eb89348469",
        "name": "Update Context Only",
        "func": "// Get current context\nlet context = flow.get('context') || {};\n\n// Update context with new values\nif (msg.topic === \"Battery SOC\") context.batterySoc = msg.payload;\nif (msg.topic === \"AC Power L1\") context.L1Power = Math.abs(msg.payload);\nif (msg.topic === \"AC Power L2\") context.L2Power = Math.abs(msg.payload);\nif (msg.topic === \"Solar Power\") context.solarPower = msg.payload;\n\n// Store updated context\nflow.set('context', context);\n\n// Don't pass anything forward\nreturn null;",
        "outputs": 1,
        "x": 440,
        "y": 420,
        "wires": [
            []
        ]
    }
]

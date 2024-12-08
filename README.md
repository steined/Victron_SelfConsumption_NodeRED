# Victron_SelfConsumption_NodeRED
This is a Node-RED flow that will switch MultiPlus II inverters from "ON' which passes energy through and charges batteries to "Inverter Only" which disconnects from AC and inverts. 

Steps to implement:



Step 1: Install Venus OS Large on your Cerbo or Venus device and Enable Node RED: See https://www.victronenergy.com/live/venus-os:large - Section 3.
Step 2: Access your Node RED instance via http://victron.local:1881 or http://CerboORVenusIP:1881 in your browser
Step 3: Go to the "hamburger menu" in the top right, and click "Import" and import the file to a new flow. 

Step 4: Review code, understand settings, and make sure it fits your usage needs. 

Step 5: Click "Deploy" 

Step 6: Click debug icon to view outputs and monitor connection status in your Cerbo Touch or browser or VRM. 
<img width="532" alt="image" src="https://github.com/user-attachments/assets/07f3e7bd-2ccf-4ebe-936a-db6ecc7628ce">

To-Do:

1.) Optimize the enable AC on sustanted power - Currently it just looks for an instantaneous value over 3000 and enables AC power. This could lead to on-off-on switch behaviour under transient loads. Need to totalize and average this over a few minute window for it to make sense. 

2.) Try to control the discharge amount to an amount of expected solar gain for the next day utilizing the VRM solar prediction. This will enable better usage of solar and batteries by not over-discharging the batteries degrading their cycle-count and avoiding the AC-->DC-->AC cycle to the extent possible. 



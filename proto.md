# Tick protocol

Once each tick, a message is sent. Here is an example message:

```
0                001001100111011                     011111101000010                     100101110100011             10
This is a player Fifteen bits of player x (int part) Fifteen bits of player y (int part) Fifteen bits of player UUID Two bits of direction*

0                101010111000011                     010001101010111                     111                              101101010010111             00
This is a player Fifteen bits of player x (int part) Fifteen bits of player y (int part) Fifteen bits of player UUID Two bits of direction*

1                011010101011011                     011010101011011                     11
This is a bullet Fifteen bits of bullet x (int part) Fifteen bits of bullet x (int part) Two bits of direction
```

Notes:
 - All integers are unsigned.
 - Direction is as follows:
	0. Up
	1. Down
	2. Left
	3. Right
 - The message will always start with one or more players, followed by zero or more bullets.

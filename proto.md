# WS spec

## Code table

Each character is represented by 6 bits.

code|character
--|--
0|a
1|b
2|c
3|d
4|e
5|f
6|g
7|h
8|i
9|j
10|k
11|l
12|m
13|n
14|o
15|p
16|q
17|r
18|s
19|t
20|u
21|v
22|w
23|x
24|y
25|z
26|0
27|1
28|2
29|3
30|4
31|5
32|6
33|7
34|8
35|9
36|space
63|EOF

## Server-sent messages

3 bits
0. pong (`000`)
1. handshake / token / name (`001`)  
  Bits after the first 3 are interpreted as a string based on the above code table, until the EOF character (`111111`) is sent. Note that each character in the string is represented by 6 bits. After the first EOF, a 2-dimensonal list of unique ids (14-bit numbers) and corresponding usernames (EOF-terminated) will be sent. For example, `0010101111111110110000110000100101100111000101111111101110011001010001100000100001100000100` is parsed as below:

handshake|username|EOF|user id|username|EOF|user id|username
--|--|--
`001`|`010111`|`111111`|`01100001100001`|`001011001110001011`|`111111`|`01110011001010`|`001100000100001100000100`
handshake|xD|EOF|6421|lol|EOF|7370|meme

  The list of other users and their ids shown above are also shown in the table below:

id|name
--|--
[you]|xD
6412|lol
7370|meme

2. killed (`010`)
3. draw shapes (`011`)
4. leaderboard (`100`)
5. reserved (`101`)
6. reserved (`110`)
7. reserved (`111`)

## Client-sent messages

3 bits
0. ping (`000`)  
  This should be sent periodically by the client
1. handshake / restart game (`001`)  
  This must be sent on initial connection and every time the client wishes to restart.
  - Viewport width
    This must be a 12-bit unsigned integer (up to 4095)
  - Viewport height
    This must be a 11-bit unsigned integer (up to 2047)
  *Example*:  
  A 1920x1080 viewport size is encoded in the handshake as `00101111000000010000111000`.

handshake|width|height
--|--|--
`001`|`011110000000`|`10000111000`

2. keydown (`010`)  
  2 bits
  0. up (`000`)
  1. down (`001`)
  2. left (`001`)
  3. right (`001`)
3. keyup (`011`)  
  2 bits
  0. up (`000`)
  1. down (`001`)
  2. left (`001`)
  3. right (`001`)
4. shoot (`100`)
5. reserved
6. reserved
7. reserved
8. reserved

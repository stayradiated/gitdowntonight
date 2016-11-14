package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	fmt.Println(">>> Please enter an organisation name")
	reader.ReadString('\n')
	fmt.Println(">>> Processing 9/63 repositories...")
	fmt.Println(">>> 1. Jimmy: 67023 contributions")
	fmt.Println(">>> 2. Anna 4024 contributions")
	fmt.Println(">>> 3. Michelle 200 contributions")
	fmt.Println(">>> 4. Bananaman 3 contributions")
}

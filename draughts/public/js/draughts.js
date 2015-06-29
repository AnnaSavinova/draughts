$(document).ready(function () {
    var socket = io.connect();

    socket.on('move', function (changes) {
        ReDrawBoard(changes);
    });

    $("#start-game").click(function () {
        socket.emit('start');
    });

    socket.on('wait', function () {
        document.getElementById('status').innerText = '... Ожидание противника ...';
    });

    socket.on('end', function (win_color) {
        document.getElementById('status').innerText = (win_color == color ? 'Вы выиграли!' : 'Вы проиграли');
        is_turn = false;
    });

    var color;
    var is_turn;
    var rest_figs;
    socket.on('ready', function (gameId, turn) {
        document.getElementById('status').innerText = "";
        document.getElementById('color').innerText = (turn == 'white' ? 'Вы играете белыми' : 'Вы играете черными');
        document.getElementById('turn').innerText = (turn == 'white' ? 'Ваш ход' : 'Ход соперника');
        color = turn;
        is_turn = (turn == 'white');
        rest_figs = 12;
        CreateBoard();
    });

    function CreateBoard() {
        var table = document.getElementById("board-table");
        table.removeChild(table.firstElementChild);
        table.appendChild(document.createElement('tbody'));
        var body = table.firstElementChild;
        for (var i = 0; i < 8; ++i) {
            var tr = document.createElement('tr');
            for (var j = 0; j < 8; ++j) {
                var cell = document.createElement('td');
                if ((i + j) % 2 == 0) {
                    cell.style.background = "white";
                } else {
                    cell.style.background = "grey";
                    if (i < 3) {
                        cell.style.color = "black";
                        cell.innerText = "O";
                    }
                    if (i > 4) {
                        cell.style.color = "white";
                        cell.innerText = "O";
                    }
                }
                tr.appendChild(cell);
                cell.setAttribute("id", i + "." + j);
                cell.className = "cell";
                cell.onclick = CellClick;
            }
            body.appendChild(tr);
        }
        table.style.visibility = "visible";
    }

    function ReDrawBoard(changes) {
        for (var i = 0; i < changes.length; ++i) {
            var cell = document.getElementById(changes[i].id);
            cell.innerText = changes[i].text;
            cell.style.color = changes[i].color;
            if (changes[i].text != "" && changes[i].color == "white" && getXFromId(changes[i].id) == 0) {
                cell.innerText = "Q";
            }
            if (changes[i].text != "" && changes[i].color == "black" && getXFromId(changes[i].id) == 7) {
                cell.innerText = "Q";
            }
        }
        is_turn = (is_turn ? false : true);
    }

    function getXFromId(id) {
        return parseInt(id);
    }

    function getYFromId(id) {
        return parseInt(id.split(".")[1]);
    }

    var currentMove = [];
    var moveType;
    var attackedFigs = [];

    //если вернул false - надо очистить ход
    function addCell(x, y) {
        var current = document.getElementById(x + "." + y);
        if ((x + y) % 2 == 0) {
            alert("белая клетка");
            return false;
        }
        if (currentMove.length > 0) {
            var last_x = getXFromId(currentMove[currentMove.length - 1]);
            var last_y = getYFromId(currentMove[currentMove.length - 1]);
            var last = document.getElementById(last_x + "." + last_y);
            if (x == last_x && y == last_y) {
                //отмена выбора
                document.getElementById(last_x + "." + last_y).style.background = "gray";
                currentMove.pop();
                alert("TODO");
                return true;
            }

            if (current.textContent != "") {
                alert('непустая клетка');
                return false;
            }

            if (ArrayContainsElem(currentMove, (x + "." + y))) {
                alert('сброс цепочки');
                return false;
            }

            if ((x - last_x == 1) || (x - last_x == -1)) {
                if (moveType == 'attack') {
                    alert('недопустимый ход при атаке');
                    return false;
                }
                if (x - last_x == 1 && last.innerText != "Q" && color == "white") {
                    alert('белые не дамки не могут ходить вниз');
                    return false;
                }
                if (x - last_x == -1 && last.innerText != "Q" && color == "black") {
                    alert('черные не дамки не могут ходить вверх');
                    return false;
                }
                moveType = 'simple';
            } else if ((x - last_x == 2) || (x - last_x == -2)) {
                if ((x - last_x == 2) && (y - last_y == 2)) {
                    //вниз-вправо
                    var fig = document.getElementById((x - 1) + "." + (y - 1));
                } else if ((x - last_x == 2) && (y - last_y == -2)) {
                    //вниз-влево
                    fig = document.getElementById((x - 1) + "." + (y + 1));
                } else if ((x - last_x == -2) && (y - last_y == 2)) {
                    //вверх-вправо
                    fig = document.getElementById((x + 1) + "." + (y - 1));
                } else if ((x - last_x == -2) && (y - last_y == -2)) {
                    //вверх-влево
                    fig = document.getElementById((x + 1) + "." + (y + 1));
                } else {
                    alert('ход не по диагонали');
                    return false;
                }

                if (fig.innerText == "") {
                    alert('атакуется пустая клетка');
                    return false;
                }
                if (fig.style.color == color) {
                    alert('атакуется своя фигура');
                    return false;
                }
                attackedFigs.push(fig.id);
                moveType = 'attack';
            } else if (document.getElementById(currentMove[0]).innerText == "Q") {
                //дамка
                if (!((x - last_x) == (y - last_y) || (x - last_x) == (last_y - y))) {
                    alert('ход не по диагонали');
                    return false;
                }
                //TODO ход дамки
            } else {
                alert('gmm');
                return false;
            }
        } else {
            if (current.textContent == "") {
                alert('первый ход должен быть на занятую');
                return false;
            } else {
                if (current.style.color != color) {
                    alert('фигура другого игрока');
                    return false;
                }
            }
        }
        currentMove.push(x + "." + y);
        return true;
    }

    function CleanMove() {
        for (var i = 0; i < currentMove.length; ++i) {
            document.getElementById(currentMove[i]).style.background = "gray";
        }
        currentMove = [];
        attackedFigs = [];
    }

    /**
     * @return {boolean}
     */
    function ArrayContainsElem(arr, el) {
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i] === el) {
                return true;
            }
        }
        return false;
    }

    /**
     * @return {boolean}
     */
    function CheckHasMove() {
        if (moveType == 'attack') {
            var x = getXFromId(currentMove[currentMove.length - 1]);
            var y = getYFromId(currentMove[currentMove.length - 1]);
            if (x > 1 && y > 1) {
                var fig = document.getElementById((x - 1) + '.' + (y - 1));
                if (!(ArrayContainsElem(attackedFigs, (x - 1) + '.' + (y - 1))) && fig.innerText != "" && fig.style.color != color) {
                    fig = document.getElementById((x - 2) + '.' + (y - 2));
                    if (fig.innerText == "") {
                        return true;
                    }
                }
            }
            if (x > 1 && y < 6) {
                fig = document.getElementById((x - 1) + '.' + (y + 1));
                if (!(ArrayContainsElem(attackedFigs, (x - 1) + '.' + (y + 1))) && fig.innerText != "" && fig.style.color != color) {
                    fig = document.getElementById((x - 2) + '.' + (y + 2));
                    if (fig.innerText == "") {
                        return true;
                    }
                }
            }
            if (x < 6 && y > 1) {
                fig = document.getElementById((x + 1) + '.' + (y - 1));
                if (!(ArrayContainsElem(attackedFigs, (x + 1) + '.' + (y - 1))) && fig.innerText != "" && fig.style.color != color) {
                    fig = document.getElementById((x + 2) + '.' + (y - 2));
                    if (fig.innerText == "") {
                        return true;
                    }
                }
            }
            if (x < 6 && y < 6) {
                fig = document.getElementById((x + 1) + '.' + (y + 1));
                if (!(ArrayContainsElem(attackedFigs, (x + 1) + '.' + (y + 1))) && fig.innerText != "" && fig.style.color != color) {
                    fig = document.getElementById((x + 2) + '.' + (y + 2));
                    if (fig.innerText == "") {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function CellClick() {
        var x = getXFromId(this.id);
        var y = getYFromId(this.id);
        if (is_turn) {
            var changes = [];
            if (addCell(x, y) == false) {
                CleanMove();
            } else {
                document.getElementById(this.id).style.background = "lightslategray";
                if (moveType == 'simple') {
                    changes[0] = {
                        'id': currentMove[0],
                        'text': '',
                        'color': color
                    };
                    changes[1] = {
                        'id': this.id,
                        'text': document.getElementById(currentMove[0]).innerText,
                        'color': color
                    };
                    socket.emit('move', changes, function () {
                        ReDrawBoard(changes);
                    });
                    moveType = '';
                    CleanMove();
                } else if (moveType == 'attack') {
                    if (!CheckHasMove()) {
                        changes[0] = {
                            'id': currentMove[0],
                            'text': '',
                            'color': color
                        };
                        for (var i = 0; i < attackedFigs.length; ++i) {
                            changes.push({
                                'id': attackedFigs[i],
                                'text': '',
                                'color': color
                            });
                            rest_figs--;
                        }
                        changes.push({
                            'id': this.id,
                            'text': document.getElementById(currentMove[0]).innerText,
                            'color': color
                        });
                        if (rest_figs > 0) {
                            socket.emit('move', changes, function () {
                                ReDrawBoard(changes);
                            });
                        } else {
                            socket.emit('end', color, function (gameId) {
                                document.getElementById('status').innerText = 'Вы выиграли!';
                                is_turn = false;
                            });
                        }
                        moveType = '';
                        CleanMove();
                    }
                }
            }
        } else {
            alert('не ваш ход');
        }
    }
})
;
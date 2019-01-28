<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <title>Bootstrap Example</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.6/umd/popper.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.2.1/js/bootstrap.min.js"></script>
</head>
<body>

<div class="jumbotron text-center">
    <h1>Статьи</h1>
    <p>Список статей</p>
</div>

<div class="container">
    <div class="row">
        <div class="col-sm-4">
            <h3>Статья 1</h3>
            <p>Короткое описание</p>
        </div>
        <div class="col-sm-4">
            <h3>Статья 2</h3>
            <p>Короткое описание</p>
        </div>
        <div class="col-sm-4">
            <h3>Статья 3</h3>
            <p>Короткое описание</p>
        </div>
    </div>
</div>

</body>
</html>

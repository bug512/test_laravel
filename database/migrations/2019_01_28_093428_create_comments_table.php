<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateCommentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('article_id', false, true)->nullable();
            $table->foreign('article_id')
                ->references('id')->on('articles');
            $table->integer('user_id', false, true)->nullable();
            $table->foreign('user_id')
                ->references('id')->on('user');
            $table->string('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('comments');
    }
}
